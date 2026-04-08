import { FastifyInstance } from "fastify/types/instance";
import { Role } from "../../generated/prisma/client.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import OrdersService from "../../services/orders.service.js";
import {
  CreateOrderRequest,
  CreateOrderSchema,
  OrderIdParams,
  OrderIdParamsSchema,
  OrderResponseSchema,
  OrdersListResponseSchema,
  StatusUpdateRequest,
  StatusUpdateSchema,
} from "../../schemas/orders.schema.js";

export const ordersRoutes = async (app: FastifyInstance) => {
  const ordersService = new OrdersService(app.prisma);

  app.post<{ Body: CreateOrderRequest }>(
    "/orders",
    {
      schema: {
        body: CreateOrderSchema,
        response: {
          201: OrderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.USER])],
    },
    async (request, reply) => {
      const order = await ordersService.createOrder(request.user.id, request.body);
      return reply.status(201).send(order);
    },
  );

  app.get<{ Params: OrderIdParams }>(
    "/orders/:id",
    {
      schema: {
        params: OrderIdParamsSchema,
        response: {
          200: OrderResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const order = await ordersService.getOrderById(request.params.id, request.user);
      return reply.status(200).send(order);
    },
  );

  app.get(
    "/users/me/orders",
    {
      schema: {
        response: {
          200: OrdersListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.USER])],
    },
    async (request, reply) => {
      const orders = await ordersService.getUserOrders(request.user.id);
      return reply.status(200).send(orders);
    },
  );

  app.get(
    "/restaurants/me/orders",
    {
      schema: {
        response: {
          200: OrdersListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      const orders = await ordersService.getRestaurantOrders(request.user.id);
      return reply.status(200).send(orders);
    },
  );

  app.patch<{ Params: OrderIdParams; Body: StatusUpdateRequest }>(
    "/orders/:id/status",
    {
      schema: {
        params: OrderIdParamsSchema,
        body: StatusUpdateSchema,
        response: {
          200: OrderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.RESTAURANT])],
    },
    async (request, reply) => {
      const order = await ordersService.updateOrderStatus(
        request.params.id,
        request.body,
        request.user.id,
      );
      return reply.status(200).send(order);
    },
  );

  app.delete<{ Params: OrderIdParams }>(
    "/orders/:id",
    {
      schema: {
        params: OrderIdParamsSchema,
        response: {
          204: { type: "null" },
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.USER])],
    },
    async (request, reply) => {
      await ordersService.cancelOrder(request.params.id, request.user.id);
      return reply.status(204).send();
    },
  );
};
