import type { IResolvers } from "mercurius";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma } from "../plugins/prismaInstance.js";

export interface ResolverContext {
  prisma: PrismaClient;
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// 2. Function signature: takes app, returns resolvers
export const createRestaurantResolvers = (
  app: FastifyInstance,
): IResolvers => ({
  // 3. QUERY resolvers - for reading data
  Query: {
    // 3.1 Get all restaurants (no auth required)
    restaurants: async (parent: any, args: any, context: ResolverContext) => {
      // Query all restaurants from database
      return await prisma.restaurant.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },

    // 3.2 Get a restaurant by ID (no auth required)
    restaurant: async (
      parent: any,
      args: { id: string },
      context: ResolverContext,
    ) => {
      // Query a single restaurant by ID from database
      return await prisma.restaurant.findUnique({
        where: { id: args.id },
        select: {
          id: true,
          email: true,
          name: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },

    // 3.3 Get current user's orders (requires authentication)
    myOrders: async (parent: any, args: any, context: ResolverContext) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error("Authentication required: Please provide a valid JWT token");
      }

      // Get all orders for the authenticated user
      return await prisma.order.findMany({
        where: { userId: context.user.id },
        select: {
          id: true,
          userId: true,
          restaurantId: true,
          status: true,
          totalPrice: true,
          deliveryAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },

    // 3.4 Get a specific order by ID (requires authentication)
    order: async (
      parent: any,
      args: { id: string },
      context: ResolverContext,
    ) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error("Authentication required: Please provide a valid JWT token");
      }

      // Get order by ID
      const order = await prisma.order.findUnique({
        where: { id: args.id },
        select: {
          id: true,
          userId: true,
          restaurantId: true,
          status: true,
          totalPrice: true,
          deliveryAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Check if order exists
      if (!order) {
        throw new Error("Order not found");
      }

      // Check if user owns this order (security check)
      if (order.userId !== context.user.id) {
        throw new Error("Unauthorized: You can only view your own orders");
      }

      return order;
    },
  },

  // 4. FIELD resolvers - for nested data
  Restaurant: {
    // 4.1 Resolver for restaurant.dishes - fetch all dishes for this restaurant
    dishes: async (parent: any, args: any, context: ResolverContext) => {
      // parent.id = the restaurant ID from the parent query
      // Fetch all dishes for this restaurant
      return await prisma.plat.findMany({
        where: { restaurantId: parent.id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          restaurantId: true,
        },
      });
    },
  },

  // 5. ORDER resolvers - for nested order data
  Order: {
    // 5.1 Resolver for order.items - fetch items in this order
    items: async (parent: any, args: any, context: any) => {
      const rows = await prisma.orderItem.findMany({
        where: { orderId: parent.id },
        select: {
          id: true,
          orderId: true,
          platId: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
        },
      });
      // GraphQL schema exposes the field as "dishId"; Prisma stores it as "platId"
      return rows.map((row) => ({ ...row, dishId: row.platId }));
    },
  },

  // 6. MUTATION resolvers - for writing data
  Mutation: {
    // 6.1 Create a new order (requires authentication)
    createOrder: async (
      parent: any,
      args: { input: any },
      context: ResolverContext,
    ) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error("Authentication required: Please provide a valid JWT token");
      }

      // Validate restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: args.input.restaurantId },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Validate and calculate order total
      let totalPrice = 0;
      const orderItems: any[] = [];

      for (const item of args.input.items) {
        // Find the dish
        const dish = await prisma.plat.findUnique({
          where: { id: item.dishId },
        });

        if (!dish) {
          throw new Error(`Dish with ID ${item.dishId} not found`);
        }

        // Calculate subtotal for this item
        const subtotal = dish.price * item.quantity;
        totalPrice += subtotal;

        orderItems.push({
          platId: item.dishId,
          quantity: item.quantity,
          unitPrice: dish.price,
          subtotal,
        });
      }

      // Create order with items
      const order = await prisma.order.create({
        data: {
          userId: context.user.id,
          restaurantId: args.input.restaurantId,
          totalPrice,
          deliveryAddress: args.input.deliveryAddress || "Not specified",
          status: "PENDING",
          items: {
            createMany: {
              data: orderItems,
            },
          },
        },
        select: {
          id: true,
          userId: true,
          restaurantId: true,
          status: true,
          totalPrice: true,
          deliveryAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return order;
    },

    // 6.2 Cancel an order (requires authentication)
    cancelOrder: async (
      parent: any,
      args: { orderId: string },
      context: ResolverContext,
    ) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error("Authentication required: Please provide a valid JWT token");
      }

      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Check if user owns this order
      if (order.userId !== context.user.id) {
        throw new Error("Unauthorized: You can only cancel your own orders");
      }

      // Check if order can be cancelled (not already delivered)
      if (order.status === "DELIVERED") {
        throw new Error("Cannot cancel a delivered order");
      }

      await prisma.order.update({
        where: { id: args.orderId },
        data: { status: "CANCELLED" },
      });

      return true;
    },
  },
});
