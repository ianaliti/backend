import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth/index.js";
import { restaurantsRoutes } from "./restaurants/index.js";

export const registerRoutes = async (app: FastifyInstance) => {
// Routes API
  await app.register(
    async (fastify) => {
      await fastify.register(authRoutes, { prefix: "/auth" });
      await fastify.register(restaurantsRoutes, { prefix: "/restaurants" });
    },
    { prefix: "/api" },
  );
};
