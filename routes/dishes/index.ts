import { FastifyInstance } from "fastify/types/instance";
import { Role } from "../../generated/prisma/client.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import {
  CreateDishRequest,
  CreateDishSchema,
  DishIdParams,
  DishIdParamsSchema,
  DishListResponseSchema,
  DishResponseSchema,
  RestaurantIdParams,
  RestaurantIdParamsSchema,
  UpdateDishRequest,
  UpdateDishSchema,
} from "../../schemas/dishes.schema.js";
import DishesService from "../../services/dishes.service.js";

export const dishesRoutes = async (app: FastifyInstance) => {
  const dishesService = new DishesService(app.prisma);

  app.post<{ Body: CreateDishRequest }>(
    "/dishes",
    {
      schema: {
        body: CreateDishSchema,
        response: {
          201: DishResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      const dish = await dishesService.createDish(request.user.id, request.body);
      return reply.status(201).send(dish);
    },
  );

  app.get<{ Params: RestaurantIdParams }>(
    "/restaurants/:restaurantId/dishes",
    {
      schema: {
        params: RestaurantIdParamsSchema,
        response: {
          200: DishListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const dishes = await dishesService.getDishesByRestaurant(
        request.params.restaurantId,
      );
      return reply.status(200).send(dishes);
    },
  );

  app.get<{ Params: DishIdParams }>(
    "/dishes/:id",
    {
      schema: {
        params: DishIdParamsSchema,
        response: {
          200: DishResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const dish = await dishesService.getDishById(request.params.id);
      return reply.status(200).send(dish);
    },
  );

  app.patch<{ Params: DishIdParams; Body: UpdateDishRequest }>(
    "/dishes/:id",
    {
      schema: {
        params: DishIdParamsSchema,
        body: UpdateDishSchema,
        response: {
          200: DishResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      const dish = await dishesService.updateDish(
        request.params.id,
        request.body,
        request.user.id,
      );
      return reply.status(200).send(dish);
    },
  );

  app.delete<{ Params: DishIdParams }>(
    "/dishes/:id",
    {
      schema: {
        params: DishIdParamsSchema,
        response: {
          204: { type: "null" },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      await dishesService.deleteDish(request.params.id, request.user.id);
      return reply.status(204).send();
    },
  );
};
