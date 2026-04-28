import { FastifyInstance } from "fastify";
import mercurius from "mercurius";
import { restaurantSchema } from "./restaurant.schema.js";
import { createRestaurantResolvers } from "./restaurant.resolvers.js";

export const registerGraphQL = async (app: FastifyInstance) => {
  const resolvers = createRestaurantResolvers(app);

  await app.register(mercurius, {
    schema: restaurantSchema,
    resolvers,
    graphiql: process.env.NODE_ENV === "development",
    path: "/graphql",
    context: async (request: any) => {
      try {
        const authHeader = request.headers?.authorization;

        if (!authHeader) {
          return {
            prisma: app.prisma,
            user: undefined,
          };
        }

        const token = authHeader.startsWith("Bearer ") 
          ? authHeader.substring(7) 
          : authHeader;

        const payload: any = await app.jwt.verify(token);
        
        return {
          prisma: app.prisma,
          user: payload,
        };
      } catch (error: any) {
        return {
          prisma: app.prisma,
          user: undefined,
        };
      }
    },
  });
};
