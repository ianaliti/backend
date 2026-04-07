import { Static, Type } from "@sinclair/typebox";

export const CreateDishSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  description: Type.Optional(Type.String()),
  price: Type.Number({ minimum: 0 }),
  image: Type.Optional(Type.String()),
  category: Type.Optional(Type.String({ minLength: 2 })),
});

export const UpdateDishSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2 })),
  description: Type.Optional(Type.String()),
  price: Type.Optional(Type.Number({ minimum: 0 })),
  image: Type.Optional(Type.String()),
  category: Type.Optional(Type.String({ minLength: 2 })),
  isAvailable: Type.Optional(Type.Boolean()),
});

export const DishIdParamsSchema = Type.Object({
  id: Type.String(),
});

export const RestaurantIdParamsSchema = Type.Object({
  restaurantId: Type.String(),
});

export const DishResponseSchema = Type.Object({
  id: Type.String(),
  restaurantId: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  price: Type.Number(),
  image: Type.Union([Type.String(), Type.Null()]),
  category: Type.String(),
  isAvailable: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const DishListResponseSchema = Type.Array(DishResponseSchema);

export type CreateDishRequest = Static<typeof CreateDishSchema>;
export type UpdateDishRequest = Static<typeof UpdateDishSchema>;
export type DishIdParams = Static<typeof DishIdParamsSchema>;
export type RestaurantIdParams = Static<typeof RestaurantIdParamsSchema>;
