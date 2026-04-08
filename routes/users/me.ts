import { FastifyInstance } from "fastify/types/instance";
import { Role } from "../../generated/prisma/client.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import UsersService from "../../services/users.service.js";
import {
  UpdateUserRequest,
  UpdateUserSchema,
  UserMeResponseSchema,
} from "../../schemas/users.schema.js";

export const usersMeRoutes = async (app: FastifyInstance) => {
  const usersService = new UsersService(app.prisma);

  app.get(
    "/me",
    {
      schema: {
        response: {
          200: UserMeResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.USER])],
    },
    async (request, reply) => {
      const profile = await usersService.getMyProfile(request.user.id);
      return reply.status(200).send(profile);
    },
  );

  app.patch<{ Body: UpdateUserRequest }>(
    "/me",
    {
      schema: {
        body: UpdateUserSchema,
        response: {
          200: UserMeResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.USER])],
    },
    async (request, reply) => {
      const updated = await usersService.updateUser(
        request.user.id,
        request.body,
      );
      return reply.status(200).send(updated);
    },
  );

  app.delete(
    "/me",
    {
      schema: {
        response: {
          204: { type: "null" },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize([Role.USER])],
    },
    async (request, reply) => {
      await usersService.deleteUser(request.user.id);
      return reply.status(204).send();
    },
  );
};

