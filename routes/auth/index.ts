import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyRequest } from "fastify";
import AuthService from "../../services/auth.service.js";
import {
  LoginSchema,
  RegisterSchema,
  TokenResponseSchema,
  RefreshRequestSchema,
  type LoginRequest,
  type RegisterRequest,
  type RefreshRequest,
} from "../../schemas/auth.schema.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import { TooManyRequestsError } from "../../common/exceptions.js";
import { User } from "../../generated/prisma/client.js";

// ── Login brute-force protection ──────────────────────────────────────────────
const WINDOW_MS      = 60_000          // 1-minute sliding window
const MAX_FAILURES   = 5               // failures before hard block
const HARD_BLOCK_MS  = 15 * 60_000    // 15-minute hard block
// Soft delay added after each failure (index = failure count, 0-indexed)
const SOFT_DELAYS_MS = [0, 1_000, 2_000, 4_000, 8_000]

interface AttemptRecord {
  failures:     number
  windowStart:  number  // when the current 1-min window began
  blockedUntil: number  // hard block expires at this timestamp
  nextAllowedAt: number // soft lockout expires at this timestamp
}

const loginAttempts = new Map<string, AttemptRecord>()

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, r] of loginAttempts) {
    if (r.blockedUntil < now && r.nextAllowedAt < now && now - r.windowStart > WINDOW_MS) {
      loginAttempts.delete(ip)
    }
  }
}, 5 * 60_000).unref()

function getClientIp(req: FastifyRequest): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown"
}
// ─────────────────────────────────────────────────────────────────────────────

export const authRoutes = async (app: FastifyInstance) => {
  const authService = new AuthService(app.prisma);
  const { register, login } = authService;

  app.post<{ Body: RegisterRequest }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          201: TokenResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await register(request.body);
      const token = app.jwt.sign({ id: user.id, role: user.role }, { expiresIn: "15m" });
      const refreshToken = await authService.createRefreshToken(user.id, user.role);
      return reply.status(201).send({ token, refreshToken });
    },
  );

  app.post<{ Body: LoginRequest }>(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: TokenResponseSchema,
          401: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const ip  = getClientIp(request)
      const now = Date.now()

      let record = loginAttempts.get(ip)

      // Hard block — checked before anything else
      if (record && record.blockedUntil > now) {
        const retryAfter = Math.ceil((record.blockedUntil - now) / 1000)
        reply.header("Retry-After", retryAfter)
        throw new TooManyRequestsError(
          `IP blocked for ${Math.ceil(retryAfter / 60)} min after too many failed attempts.`
        )
      }

      // Soft lockout — increasing delay between failures
      if (record && record.nextAllowedAt > now) {
        const retryAfter = Math.ceil((record.nextAllowedAt - now) / 1000)
        reply.header("Retry-After", retryAfter)
        throw new TooManyRequestsError(
          `Too many failed attempts. Wait ${retryAfter}s before trying again.`
        )
      }

      // Reset window if it expired
      if (!record || now - record.windowStart > WINDOW_MS) {
        record = { failures: 0, windowStart: now, blockedUntil: 0, nextAllowedAt: 0 }
      }

      try {
        const user  = await login(request.body)
        // Success → clear the tracker for this IP
        loginAttempts.delete(ip)
        const token = app.jwt.sign({ id: user.id, role: user.role }, { expiresIn: "15m" })
        const refreshToken = await authService.createRefreshToken(user.id, user.role)
        return reply.status(200).send({ token, refreshToken })
      } catch (err) {
        record.failures++

        if (record.failures >= MAX_FAILURES) {
          // Hard block
          record.blockedUntil  = now + HARD_BLOCK_MS
          record.nextAllowedAt = now + HARD_BLOCK_MS
        } else {
          // Soft lockout: 1s → 2s → 4s → 8s
          record.nextAllowedAt = now + SOFT_DELAYS_MS[record.failures]
        }

        loginAttempts.set(ip, record)
        throw err
      }
    },
  );

  app.post<{ Body: RefreshRequest }>(
    "/refresh",
    {
      schema: {
        body: RefreshRequestSchema,
        response: {
          200: TokenResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { accountId, role } = await authService.refresh(request.body.refreshToken);
      const token = app.jwt.sign({ id: accountId, role }, { expiresIn: "15m" });
      const refreshToken = await authService.createRefreshToken(accountId, role);
      return reply.status(200).send({ token, refreshToken });
    },
  );

  app.post<{ Body: RefreshRequest }>(
    "/logout",
    {
      schema: {
        body: RefreshRequestSchema,
        response: {
          204: Type.Null(),
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await authService.revokeRefreshToken(request.body.refreshToken);
      return reply.status(204).send();
    },
  );

  app.get(
    "/me",
    {
      schema: {
        response: {
          200: Type.Unsafe<Omit<User, "password">>(),
          401: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      return request.user;
    },
  );
};
