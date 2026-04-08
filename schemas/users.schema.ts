import { Static, Type } from "@sinclair/typebox";

export const UpdateUserSchema = Type.Object({
  email: Type.Optional(Type.String({ format: "email" })),
  name: Type.Optional(Type.String({ minLength: 2 })),
});

export const UserMeResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
  name: Type.Union([Type.String(), Type.Null()]),
  role: Type.Literal("USER"),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export type UpdateUserRequest = Static<typeof UpdateUserSchema>;
export type UserMeResponse = Static<typeof UserMeResponseSchema>;
