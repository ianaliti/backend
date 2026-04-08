import { Static, Type } from "@sinclair/typebox";

export const OrderItemInputSchema = Type.Object({
  dishId: Type.String(),
  quantity: Type.Integer({ minimum: 1 }),
});

export const CreateOrderSchema = Type.Object({
  restaurantId: Type.String(),
  deliveryAddress: Type.Optional(Type.String({ minLength: 3 })),
  items: Type.Array(OrderItemInputSchema, { minItems: 1 }),
});

export const StatusUpdateSchema = Type.Object({
  status: Type.Union([
    Type.Literal("CONFIRMED"),
    Type.Literal("PREPARING"),
    Type.Literal("READY"),
    Type.Literal("DELIVERED"),
  ]),
});

export const OrderIdParamsSchema = Type.Object({
  id: Type.String(),
});

export const OrderItemResponseSchema = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  dishId: Type.String(),
  quantity: Type.Integer(),
  unitPrice: Type.Number(),
  subtotal: Type.Number(),
});

export const OrderResponseSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  restaurantId: Type.String(),
  status: Type.Union([
    Type.Literal("PENDING"),
    Type.Literal("CONFIRMED"),
    Type.Literal("PREPARING"),
    Type.Literal("READY"),
    Type.Literal("DELIVERED"),
  ]),
  totalPrice: Type.Number(),
  deliveryAddress: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  items: Type.Array(OrderItemResponseSchema),
});

export const OrdersListResponseSchema = Type.Array(OrderResponseSchema);

export type CreateOrderRequest = Static<typeof CreateOrderSchema>;
export type StatusUpdateRequest = Static<typeof StatusUpdateSchema>;
export type OrderIdParams = Static<typeof OrderIdParamsSchema>;
