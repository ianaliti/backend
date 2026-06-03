import { PrismaClient, Role } from "../generated/prisma/client.js";
import { hash } from "bcryptjs";
import { BadRequestError, ConflictError, NotFoundError } from "../common/exceptions.js";
import { UpdateUserRequest } from "../schemas/users.schema.js";

type UserResponse = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export default class UsersService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  getMyProfile = async (userId: string): Promise<UserResponse> => {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return this.toUserResponse(user);
  };

  updateUser = async (
    userId: string,
    input: UpdateUserRequest,
  ): Promise<UserResponse> => {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictError("Email already used");
      }
    }

    const data: Record<string, unknown> = {};
    if (input.email) data.email = input.email;
    if (input.name !== undefined) data.name = input.name;
    if (input.password) data.password = await hash(input.password, 10);

    if (Object.keys(data).length === 0) {
      throw new BadRequestError("No updatable fields provided");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toUserResponse(updated);
  };

  deleteUser = async (userId: string): Promise<void> => {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    await this.prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await this.prisma.order.deleteMany({ where: { userId } });
    await this.prisma.rating.deleteMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });
  };
}

