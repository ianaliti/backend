import type { IResolvers } from "mercurius";
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../common/exceptions.js";

export const createRestaurantResolvers = (
  app: FastifyInstance,
): IResolvers => ({
  //completer avec les resolvers pour les restaurants, pouvoir recuperer la liste des restaurants et un restaurant par son id
  Query: {},
});
