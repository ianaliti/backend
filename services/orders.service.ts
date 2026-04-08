import { PrismaClient, Role } from "../generated/prisma/client.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../common/exceptions.js";
import { notifyRestaurant } from "./websocket.service.js";
import {
  CreateOrderRequest,
  StatusUpdateRequest,
} from "../schemas/orders.schema.js";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED";

type OrderResponse = {
  id: string;
  userId: string;
  restaurantId: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    orderId: string;
    dishId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["DELIVERED"],
  DELIVERED: [],
};

export default class OrdersService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private toOrderResponse(order: {
    id: string;
    userId: string;
    restaurantId: string;
    status: string;
    totalPrice: number;
    deliveryAddress: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      orderId: string;
      platId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }): OrderResponse {
    return {
      id: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      status: order.status as OrderStatus,
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        dishId: item.platId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };
  }

  createOrder = async (
    userId: string,
    input: CreateOrderRequest,
  ): Promise<OrderResponse> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const dishIds = input.items.map((item) => item.dishId);
    const uniqueDishIds = [...new Set(dishIds)];

    const dishes = await this.prisma.plat.findMany({
      where: { id: { in: uniqueDishIds } },
    });

    if (dishes.length !== uniqueDishIds.length) {
      throw new BadRequestError("One or more dishes do not exist");
    }

    const invalidDish = dishes.find((dish) => dish.restaurantId !== input.restaurantId);
    if (invalidDish) {
      throw new BadRequestError("All dishes must belong to the same restaurant");
    }

    const dishesById = new Map(dishes.map((dish) => [dish.id, dish]));

    const itemsData = input.items.map((item) => {
      const dish = dishesById.get(item.dishId);
      if (!dish) {
        throw new BadRequestError("Invalid dish in order items");
      }

      return {
        platId: dish.id,
        quantity: item.quantity,
        unitPrice: dish.price,
        subtotal: dish.price * item.quantity,
      };
    });

    const totalPrice = itemsData.reduce((acc, item) => acc + item.subtotal, 0);

    const order = await this.prisma.order.create({
      data: {
        userId,
        restaurantId: input.restaurantId,
        status: "PENDING",
        totalPrice,
        deliveryAddress: input.deliveryAddress ?? "To be completed",
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });

    notifyRestaurant(order.restaurantId, "new-order", {
      orderId: order.id,
      totalPrice: order.totalPrice,
      itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
      createdAt: order.createdAt.toISOString(),
    });

    return this.toOrderResponse(order);
  };

  getOrderById = async (
    orderId: string,
    actor: { id: string; role: Role },
  ): Promise<OrderResponse> => {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (actor.role === Role.USER && order.userId !== actor.id) {
      throw new ForbiddenError("You can only access your own orders");
    }

    if (actor.role === Role.RESTAURANT && order.restaurantId !== actor.id) {
      throw new ForbiddenError("You can only access your restaurant orders");
    }

    return this.toOrderResponse(order);
  };

  getUserOrders = async (userId: string): Promise<OrderResponse[]> => {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => this.toOrderResponse(order));
  };

  getRestaurantOrders = async (restaurantId: string): Promise<OrderResponse[]> => {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => this.toOrderResponse(order));
  };

  updateOrderStatus = async (
    orderId: string,
    input: StatusUpdateRequest,
    actorRestaurantId: string,
  ): Promise<OrderResponse> => {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.restaurantId !== actorRestaurantId) {
      throw new ForbiddenError("You can only update your restaurant orders");
    }

    const currentStatus = order.status as OrderStatus;
    const nextAllowedStatuses = statusTransitions[currentStatus];
    if (!nextAllowedStatuses.includes(input.status as OrderStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${input.status}`,
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: input.status },
      include: { items: true },
    });

    return this.toOrderResponse(updatedOrder);
  };

  cancelOrder = async (orderId: string, actorUserId: string): Promise<void> => {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.userId !== actorUserId) {
      throw new ForbiddenError("You can only cancel your own orders");
    }

    if (order.status !== "PENDING") {
      throw new BadRequestError("Only pending orders can be cancelled");
    }

    await this.prisma.order.delete({
      where: { id: orderId },
    });
  };
}
