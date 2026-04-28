import fastify, { FastifyInstance } from "fastify";
import { registerPlugins } from "../../plugins/index.js";
import { registerRoutes } from "../../routes/index.js";
import { registerGraphQL } from "../../graphql/index.js";
import { AppError } from "../../common/exceptions.js";


export const createTestServer = async (): Promise<FastifyInstance> => {
  const server = fastify({
    logger: false, 
  });

  // Enregistrer les plugins (JWT, Prisma, etc.)
  await registerPlugins(server);

  // Enregistrer les routes (auth, restaurants, etc.)
  await registerRoutes(server);

  // Enregistrer GraphQL
  await registerGraphQL(server);


  server.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      const problemDetail = error.problemDetail;
      problemDetail.instance = request.url;
      return reply.status(error.statusCode).send(problemDetail);
    }

    const validationError = error as any;
    if (validationError.code === "FST_ERR_VALIDATION") {
      return reply.status(400).send({
        type: "urn:app:error:validation",
        title: "Validation Error",
        status: 400,
        detail: validationError.message,
        instance: request.url,
      });
    }

    reply.status(500).send({
      type: "urn:app:error:internal",
      title: "Internal Server Error",
      status: 500,
      detail: "An unexpected error occurred",
      instance: request.url,
    });
  });

  return server;
};


export const closeTestServer = async (server: FastifyInstance) => {
  if (server) await server.close();
};

export const cleanDatabase = async (prisma: any) => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.plat.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
};


export const createTestUser = async (
  prisma: any,
  overrides?: Partial<any>,
) => {
  const { hash } = await import("bcryptjs");
  const hashedPassword = await hash("password123", 10);

  return prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: hashedPassword,
      role: "USER",
      ...overrides,
    },
  });
};

export const createTestRestaurant = async (
  prisma: any,
  overrides?: Partial<any>,
) => {
  const { hash } = await import("bcryptjs");
  const hashedPassword = await hash("password123", 10);

  return prisma.restaurant.create({
    data: {
      email: "restaurant@example.com",
      name: "Test Restaurant",
      password: hashedPassword,
      address: "123 Main Street",
      city: "Paris",
      codePostal: "75001",
      phone: "+33123456789",
      cuisine: "Italian",
      role: "RESTAURANT",
      ...overrides,
    },
  });
};
