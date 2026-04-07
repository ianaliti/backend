import { Static, Type } from "@sinclair/typebox";

export const CreateRestaurantSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
  name: Type.String({ minLength: 2 }),
  image: Type.Optional(Type.String()),
});

export const UpdateRestaurantSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2 })),
  image: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  codePostal: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  website: Type.Optional(Type.String()),
  cuisine: Type.Optional(Type.String()),
});

export const RestaurantResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  image: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  address: Type.String(),
  city: Type.String(),
  codePostal: Type.String(),
  phone: Type.String(),
  website: Type.Union([Type.String(), Type.Null()]),
  cuisine: Type.String(),
  role: Type.Literal("RESTAURANT"),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const RestaurantListResponseSchema = Type.Array(RestaurantResponseSchema);

export type CreateRestaurantRequest = Static<typeof CreateRestaurantSchema>;
export type UpdateRestaurantRequest = Static<typeof UpdateRestaurantSchema>;
