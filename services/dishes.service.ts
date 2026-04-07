import { PrismaClient } from "../generated/prisma/client.js";
import { ForbiddenError, NotFoundError } from "../common/exceptions.js";
import {
  CreateDishRequest,
  UpdateDishRequest,
} from "../schemas/dishes.schema.js";

type DishResponse = {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export default class DishesService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private toDishResponse(dish: {
    id: string;
    restaurantId: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    category: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): DishResponse {
    return {
      id: dish.id,
      restaurantId: dish.restaurantId,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      category: dish.category,
      isAvailable: dish.isAvailable,
      createdAt: dish.createdAt.toISOString(),
      updatedAt: dish.updatedAt.toISOString(),
    };
  }

  createDish = async (
    restaurantId: string,
    input: CreateDishRequest,
  ): Promise<DishResponse> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const dish = await this.prisma.plat.create({
      data: {
        restaurantId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        image: input.image ?? null,
        category: input.category ?? "General",
      },
    });

    return this.toDishResponse(dish);
  };

  getDishesByRestaurant = async (restaurantId: string): Promise<DishResponse[]> => {
    const dishes = await this.prisma.plat.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });

    return dishes.map((dish) => this.toDishResponse(dish));
  };

  getDishById = async (id: string): Promise<DishResponse> => {
    const dish = await this.prisma.plat.findUnique({ where: { id } });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    return this.toDishResponse(dish);
  };

  updateDish = async (
    id: string,
    input: UpdateDishRequest,
    actorRestaurantId: string,
  ): Promise<DishResponse> => {
    const dish = await this.prisma.plat.findUnique({ where: { id } });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    if (dish.restaurantId !== actorRestaurantId) {
      throw new ForbiddenError("You can only update your own dishes");
    }

    const updatedDish = await this.prisma.plat.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        price: input.price ?? undefined,
        image: input.image ?? undefined,
        category: input.category ?? undefined,
        isAvailable: input.isAvailable ?? undefined,
      },
    });

    return this.toDishResponse(updatedDish);
  };

  deleteDish = async (id: string, actorRestaurantId: string): Promise<void> => {
    const dish = await this.prisma.plat.findUnique({ where: { id } });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    if (dish.restaurantId !== actorRestaurantId) {
      throw new ForbiddenError("You can only delete your own dishes");
    }

    await this.prisma.plat.delete({ where: { id } });
  };
}
