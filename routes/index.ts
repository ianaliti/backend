import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth/index.js";

export const registerRoutes = async (app: FastifyInstance) => {
  // Routes API
  await app.register(
    async (fastify) => {
      await fastify.register(authRoutes, { prefix: "/auth" });
    },
    { prefix: "/api" },
  );
};
