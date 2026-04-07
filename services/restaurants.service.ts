import { hash } from "bcryptjs";
import { PrismaClient, Role } from "../generated/prisma/client.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/exceptions.js";
import {
  CreateRestaurantRequest,
  UpdateRestaurantRequest,
} from "../schemas/restaurants.schema.js";

type RestaurantProfile = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  description: string | null;
  address: string;
  city: string;
  codePostal: string;
  phone: string;
  website: string | null;
  cuisine: string;
  role: "RESTAURANT";
  createdAt: string;
  updatedAt: string;
};

export default class RestaurantsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private toRestaurantProfile(restaurant: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    description: string | null;
    address: string;
    city: string;
    codePostal: string;
    phone: string;
    website: string | null;
    cuisine: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  }): RestaurantProfile {
    return {
      id: restaurant.id,
      email: restaurant.email,
      name: restaurant.name,
      image: restaurant.image,
      description: restaurant.description,
      address: restaurant.address,
      city: restaurant.city,
      codePostal: restaurant.codePostal,
      phone: restaurant.phone,
      website: restaurant.website,
      cuisine: restaurant.cuisine,
      role: Role.RESTAURANT,
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString(),
    };
  }

  createRestaurant = async (
    input: CreateRestaurantRequest,
  ): Promise<RestaurantProfile> => {
    const [existingUser, existingRestaurant, existingAdmin] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: input.email } }),
      this.prisma.restaurant.findUnique({ where: { email: input.email } }),
      this.prisma.admin.findUnique({ where: { email: input.email } }),
    ]);

    if (existingUser || existingRestaurant || existingAdmin) {
      throw new ConflictError("Email is already used by another account");
    }

    const hashedPassword = await hash(input.password, 10);

    const restaurant = await this.prisma.restaurant.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        image: input.image ?? null,
        role: Role.RESTAURANT,
        address: "To be completed",
        city: "To be completed",
        codePostal: "00000",
        phone: "To be completed",
        cuisine: "To be completed",
      },
    });

    return this.toRestaurantProfile(restaurant);
  };

  getAllRestaurants = async (): Promise<RestaurantProfile[]> => {
    const restaurants = await this.prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
    });
    return restaurants.map((restaurant) => this.toRestaurantProfile(restaurant));
  };

  getMyRestaurant = async (restaurantId: string): Promise<RestaurantProfile> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    return this.toRestaurantProfile(restaurant);
  };

  updateRestaurant = async (
    restaurantId: string,
    input: UpdateRestaurantRequest,
    actorRestaurantId: string,
  ): Promise<RestaurantProfile> => {
    if (restaurantId !== actorRestaurantId) {
      throw new ForbiddenError("You can only update your own restaurant");
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: input.name ?? undefined,
        image: input.image ?? undefined,
        description: input.description ?? undefined,
        address: input.address ?? undefined,
        city: input.city ?? undefined,
        codePostal: input.codePostal ?? undefined,
        phone: input.phone ?? undefined,
        website: input.website ?? undefined,
        cuisine: input.cuisine ?? undefined,
      },
    });

    return this.toRestaurantProfile(updatedRestaurant);
  };
}
