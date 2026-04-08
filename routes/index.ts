import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth/index.js";
import { restaurantsRoutes } from "./restaurants/index.js";
import { dishesRoutes } from "./dishes/index.js";
import { ordersRoutes } from "./orders/index.js";

export const registerRoutes = async (app: FastifyInstance) => {
// Routes API
  await app.register(
    async (fastify) => {
      await fastify.register(authRoutes, { prefix: "/auth" });
      await fastify.register(restaurantsRoutes, { prefix: "/restaurants" });
      await fastify.register(dishesRoutes);
      await fastify.register(ordersRoutes);
    },
    { prefix: "/api" },
  );
};
