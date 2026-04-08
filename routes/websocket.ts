import { FastifyInstance, FastifyRequest } from "fastify";
import { Role } from "../generated/prisma/client.js";
import { WebSocket } from "@fastify/websocket";
import {
  registerRestaurantConnection,
  unregisterRestaurantConnection,
} from "../services/websocket.service.js";

enum WebSocketEvent {
  AUTH = "authenticate",
  PING = "ping",
  PONG = "pong",
  CONNECTED = "connected",
}

interface AuthMessage {
  event: typeof WebSocketEvent.AUTH;
  token: string;
}

interface PingMessage {
  event: typeof WebSocketEvent.PING;
}

type WebSocketMessage = AuthMessage | PingMessage;

export interface AuthenticatedSocket {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  restaurantId: string;
  socket: WebSocket;
}

export const websocketRoutes = async (app: FastifyInstance) => {
  app.get(
    "/ws/restaurant",
    { websocket: true },
    async (socket: WebSocket, request: FastifyRequest) => {
      let authSocket: AuthenticatedSocket | null = null;
      let isAuthenticated = false;

      const closeAuthError = (message: string) => socket.close(1008, message);

      socket.on("message", async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());

          if (!isAuthenticated) {
            if (message.event !== WebSocketEvent.AUTH || !("token" in message)) {
              closeAuthError("First message must be authenticate");
              return;
            }

            const payload = await app.jwt.verify<{ id: string; role: Role }>(
              message.token,
            );

            if (!payload || payload.role !== Role.RESTAURANT) {
              closeAuthError("Restaurant role is required");
              return;
            }

            const restaurant = await app.prisma.restaurant.findUnique({
              where: { id: payload.id },
            });

            if (!restaurant || restaurant.role !== Role.RESTAURANT) {
              closeAuthError("Restaurant not found");
              return;
            }

            authSocket = {
              user: {
                id: restaurant.id,
                email: restaurant.email,
                role: restaurant.role,
              },
              restaurantId: restaurant.id,
              socket,
            };

            registerRestaurantConnection(authSocket.restaurantId, authSocket);
            isAuthenticated = true;

            socket.send(
              JSON.stringify({
                event: WebSocketEvent.CONNECTED,
                data: {
                  restaurantId: authSocket.restaurantId,
                  message: "WebSocket authenticated",
                },
                timestamp: new Date().toISOString(),
              }),
            );
            return;
          }

          if (message.event === WebSocketEvent.PING) {
            socket.send(
              JSON.stringify({
                event: WebSocketEvent.PONG,
                timestamp: new Date().toISOString(),
              }),
            );
            return;
          }

          socket.send(
            JSON.stringify({
              event: "error",
              data: { message: "Unknown event" },
              timestamp: new Date().toISOString(),
            }),
          );
        } catch (error) {
          closeAuthError("Token invalide");
        }
      });

      socket.on("close", () => {
        if (authSocket) {
          unregisterRestaurantConnection(authSocket.restaurantId, authSocket);
        }
      });

      socket.on("error", (error: Error) => {
        request.log.error(error, "WebSocket error");
        if (authSocket) {
          unregisterRestaurantConnection(authSocket.restaurantId, authSocket);
        }
        socket.close(1011, "Erreur serveur");
      });
    },
  );
};
