import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { prisma } from "../../plugins/prismaInstance.js";
import { createTestServer, closeTestServer, cleanDatabase } from "../utils/test-setup.js";

describe("Authentication Integration Tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return a valid JWT token", async () => {
      // ARRANGE
      const newUser = {
        email: "test@example.com",
        password: "password123",
      };

      // ACT - Envoyer une requête POST
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: newUser,
      });

      // ASSERT : Vérifier le status HTTP
      expect(response.statusCode).toBe(201); // 201 = Created
      expect(response.json()).toHaveProperty("token");

     // Vérifier que le token est valide
      const token = response.json().token;
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");


    // Vérifier que l'utilisateur est réellement dans la base de données
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

      expect(user).toBeDefined();
      expect(user?.email).toBe("test@example.com");
    });

    it("should reject registration with invalid email format", async () => {
      // ARRANGE
      const invalidUser = {
        email: "invalid-email", // ❌ Pas de "@"
        password: "password123",
      };

      // ACT
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: invalidUser,
      });

      // ASSERT : Status 400 (Bad Request)
      expect(response.statusCode).toBe(400);

      // Vérifier qu'aucun utilisateur n'a été créé
      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it("should return 409 if the email already exists", async () => {
      // ARRANGE
      const userPayload = {
        email: "duplicate@example.com",
        password: "password123",
      };

      // Créer le premier utilisateur
      await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userPayload,
      });

      // ACT : Tentative avec le même email mais password différent
      const secondResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          ...userPayload,
          password: "differentpassword",
        },
      });

      // ASSERT : Status 409 (Conflict)
      expect(secondResponse.statusCode).toBe(409);

      // Vérifier que le status est 409 (Conflict)
      const json = secondResponse.json();
      expect(json).toHaveProperty("type");
      expect(json.status).toBe(409);

      // Vérifier qu'il n'y a qu'UN utilisateur dans la base de données
      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
    // Avant chaque test de login, créer un utilisateur de test
      await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "login@example.com",
          password: "correctpassword",
        },
      });
    });

    it("should login with valid credentials and return JWT token", async () => {
      // ARRANGE
      const credentials = {
        email: "login@example.com",
        password: "correctpassword",
      };

      // ACT : Envoyer POST /auth/login
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: credentials,
      });

      // ASSERT : Status 200 (OK)
      expect(response.statusCode).toBe(200);

      // check the token
      const json = response.json();
      expect(json).toHaveProperty("token");
      expect(typeof json.token).toBe("string");
      expect(json.token.length).toBeGreaterThan(0);
    });
    
    it("should return 401 for a non-existent user", async () => {
      // ARRANGE
      const credentials = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // ACT
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: credentials,
      });

      // ASSERT : Status 401 (Unauthorized)
      expect(response.statusCode).toBe(401);
    });
  });
});
