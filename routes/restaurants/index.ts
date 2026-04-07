import { FastifyInstance } from "fastify/types/instance";
import { Role } from "../../generated/prisma/client.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import {
  CreateRestaurantRequest,
  CreateRestaurantSchema,
  RestaurantListResponseSchema,
  RestaurantResponseSchema,
  UpdateRestaurantRequest,
  UpdateRestaurantSchema,
} from "../../schemas/restaurants.schema.js";
import RestaurantsService from "../../services/restaurants.service.js";

export const restaurantsRoutes = async (app: FastifyInstance) => {
  const restaurantsService = new RestaurantsService(app.prisma);

  app.post<{ Body: CreateRestaurantRequest }>(
    "/",
    {
      schema: {
        body: CreateRestaurantSchema,
        response: {
          201: RestaurantResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.ADMIN])],
    },
    async (request, reply) => {
      const restaurant = await restaurantsService.createRestaurant(request.body);
      return reply.status(201).send(restaurant);
    },
  );

  app.get(
    "/",
    {
      schema: {
        response: {
          200: RestaurantListResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const restaurants = await restaurantsService.getAllRestaurants();
      return reply.status(200).send(restaurants);
    },
  );

  app.get(
    "/me",
    {
      schema: {
        response: {
          200: RestaurantResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      const restaurant = await restaurantsService.getMyRestaurant(request.user.id);
      return reply.status(200).send(restaurant);
    },
  );

  app.patch<{ Body: UpdateRestaurantRequest }>(
    "/me",
    {
      schema: {
        body: UpdateRestaurantSchema,
        response: {
          200: RestaurantResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      const restaurant = await restaurantsService.updateRestaurant(
        request.user.id,
        request.body,
        request.user.id,
      );
      return reply.status(200).send(restaurant);
    },
  );
};
