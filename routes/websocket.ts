import { FastifyInstance, FastifyRequest } from "fastify";
import {
  registerRestaurantConnection,
  unregisterRestaurantConnection,
} from "../services/websocket.service.js";
import { Role } from "../generated/prisma/client.js";
import { WebSocket } from "@fastify/websocket";

enum WebSocketEvent {
  AUTH = "auth",
  PING = "ping",
  PONG = "pong",
  CONNECTED = "connected",
}

// Message types
interface AuthMessage {
  event: typeof WebSocketEvent.AUTH;
  token: string;
}

interface PingMessage {
  event: typeof WebSocketEvent.PING;
}

type WebSocketMessage = AuthMessage | PingMessage;

export const websocketRoutes = async (app: FastifyInstance) => {
  /**
   * WebSocket endpoint /ws/restaurant
   * Connecte un restaurateur pour recevoir les notifications en temps réel
   *
   * Flux de connexion:
   * 1. Attendre un event "authenticate" contenant le token JWT
   * 2. Valider le token et vérifier que l'utilisateur existe et a le rôle RESTAURANT
   * 3. Récupérer les données du restaurant associé à l'utilisateur
   * 4. Enregistrer la connexion WebSocket
   * 5. Gérer les messages entrants (ex: ping/pong)
   * 6. Gérer la déconnexion proprement
   */
  app.get(
    "/ws/restaurant",
    { websocket: true },
    async (socket: WebSocket, request: FastifyRequest) => {
      try {
        try {
          // Vérifier si le premier message contient un event "authenticate" avec le token
          // - Parser le message JSON reçu
          // - Récupérer le token de l'event "authenticate"
          // - Vérifier que le token est valide avec app.jwt.verify(token)
          // - Récupérer l'utilisateur depuis la base de données avec prisma
          // - Vérifier que l'utilisateur existe et a le rôle RESTAURANT
          // - Fermer avec code 1008 et message approprié si erreur
          // - Récupérer le restaurant associé à l'utilisateur
          // - Remplir l'authSocket avec les données utilisateur et restaurant
          // - Enregistrer la connexion WebSocket avec registerRestaurantConnection
          // - Envoyer un message de confirmation au client
          // - Ensuite, gérer les autres messages normalement (ex: ping/pong)
          socket.on("message", (data: Buffer) => {
            // À implémenter: parser et traiter les messages
            const message: WebSocketMessage = JSON.parse(data.toString());
            switch (message.event) {
              case WebSocketEvent.AUTH:
                // À implémenter: gérer l'authentification
                break;
              case WebSocketEvent.PING:
                // À implémenter: répondre avec un event PONG
                break;
              default:
                // À implémenter: gérer les messages inconnus
                break;
            }
          });

          // TODO: Implémenter un listener "close" sur le socket
          // Désenregistrer la connexion WebSocket quand le client se déconnecte
          socket.on("close", () => {
            // À implémenter: appeler unregisterRestaurantConnection
          });

          // TODO: Implémenter un listener "error" sur le socket
          // Logger l'erreur et désenregistrer la connexion
          socket.on("error", (error: Error) => {
            // À implémenter: gestion des erreurs
          });
        } catch (err: unknown) {
          // TODO: En cas d'erreur JWT, fermer la connexion avec code 1008 et "Token invalide"
        }
      } catch (error: unknown) {
        // TODO: En cas d'erreur générale, logger l'erreur et fermer avec code 1011 "Erreur serveur"
      }
    },
  );
};
