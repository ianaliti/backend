import { WebSocket } from "@fastify/websocket";

type AuthenticatedWebSocket = {
  user: {
    id: string;
    email: string;
    role: string;
  };
  restaurantId: string;
  socket: WebSocket;
};

// Map pour stocker les connexions WebSocket par restaurantId
const restaurantConnections = new Map<string, Set<AuthenticatedWebSocket>>();

/**
 * TODO: Implémentez cette fonction pour enregistrer une connexion WebSocket pour un restaurant
 *
 * Cette fonction doit:
 * 1. Vérifier si le restaurantId existe déjà dans la Map
 * 2. Si non, créer un nouveau Set pour ce restaurantId
 * 3. Ajouter le socket au Set correspondant
 */
export const registerRestaurantConnection = (
  restaurantId: string,
  socket: AuthenticatedWebSocket,
) => {
  if (!restaurantConnections.has(restaurantId)) {
    restaurantConnections.set(restaurantId, new Set());
  }

  restaurantConnections.get(restaurantId)?.add(socket);
};

/**
 * TODO: Implémentez cette fonction pour désenregistrer une connexion WebSocket
 *
 * Cette fonction doit:
 * 1. Récupérer le Set de connections pour ce restaurantId
 * 2. Supprimer le socket du Set
 * 3. Si le Set est vide, supprimer l'entrée de la Map
 */
export const unregisterRestaurantConnection = (
  restaurantId: string,
  socket: AuthenticatedWebSocket,
) => {
  const connections = restaurantConnections.get(restaurantId);
  if (!connections) return;

  connections.delete(socket);

  if (connections.size === 0) {
    restaurantConnections.delete(restaurantId);
  }
};

/**
 * TODO: Implémentez cette fonction pour envoyer une notification à tous les restaurateurs connectés
 *
 * Cette fonction doit:
 * 1. Récupérer le Set de connections pour ce restaurantId
 * 2. Créer un message JSON avec l'event, les data et un timestamp
 * 3. Envoyer ce message à chaque socket connecté
 * 4. Gérer les erreurs d'envoi avec un try-catch et un console.error
 */
export const notifyRestaurant = (
  restaurantId: string,
  event: string,
  data: any,
) => {
  const connections = restaurantConnections.get(restaurantId);
  if (!connections || connections.size === 0) return;

  const message = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const connection of connections) {
    try {
      if (connection.socket.readyState === connection.socket.OPEN) {
        connection.socket.send(message);
      }
    } catch (error) {
      console.error("Error sending websocket notification:", error);
    }
  }
};
