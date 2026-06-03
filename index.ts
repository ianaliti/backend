import fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import "./plugins/dotenvx.js";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { registerPlugins } from "./plugins/index.js";
import { registerRoutes } from "./routes/index.js";
import { registerGraphQL } from "./graphql/index.js";
import { AppError } from "./common/exceptions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = fastify({
  logger: true,
});

// Gestionnaire d'erreurs global (RFC 7807)
server.setErrorHandler((error, request, reply) => {
  // Enregistrer l'erreur complète côté serveur pour le debugging
  server.log.error({
    err: error,
    url: request.url,
    method: request.method,
  });

  // AppError: utiliser le format RFC 7807
  if (error instanceof AppError) {
    const problemDetail = error.problemDetail;
    problemDetail.instance = request.url;
    return reply.status(error.statusCode).send(problemDetail);
  }

  // Erreurs de validation Fastify
  const validationError = error as FastifyError;
  if (validationError.code === "FST_ERR_VALIDATION") {
    const validationErrors = (error as any).validation ?? [];

    const errors: Record<string, string[]> = {};
    for (const err of validationErrors) {
      const field = err.instancePath
        ? err.instancePath.replace(/^\//, "")
        : (err.params?.missingProperty ?? "root");
      if (!errors[field]) errors[field] = [];
      errors[field].push(err.message ?? "invalid");
    }

    return reply.status(400).send({
      type: "urn:app:error:validation",
      title: "Validation Error",
      status: 400,
      detail: validationError.message,
      instance: request.url,
      errors,
    });
  }

  reply.status(500).send({
    type: "urn:app:error:internal",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred",
    instance: request.url,
  });
});

server.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = "0.0.0.0";

    await server.register(cors, {
      origin: true,
      methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    await server.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });
    await server.register(swagger, {
      openapi: {
        info: {
          title: "UberEats API",
          description: "API documentation",
          version: "1.0.0",
        },
      },
      transform: ({ schema, url }) => {
        if (url.startsWith("/graphql") || url.startsWith("/graphiql")) {
          return { schema: { ...schema, hide: true }, url };
        }
        return { schema, url };
      },
    });
    await server.register(swaggerUi, {
      routePrefix: "/docs",
    });

    await registerPlugins(server);
    await registerGraphQL(server);
    await registerRoutes(server);

    await server.ready();

    await server.listen({ port, host });
    server.log.info(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
