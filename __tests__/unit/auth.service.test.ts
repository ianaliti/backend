import { describe, it, expect, beforeEach, vi } from "vitest";
import { hash } from "bcryptjs";
import AuthService from "../../services/auth.service.js";
import { ConflictError, UnauthorizedError } from "../../common/exceptions.js";


describe("Auth Service - Unit Tests", () => {
  let prisma: any;
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma avec toutes les entités
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      restaurant: {
        findUnique: vi.fn(),
      },
      admin: {
        findUnique: vi.fn(),
      },
    };

    authService = new AuthService(prisma);
  });

  describe("register()", () => {
    it("devrait enregistrer un nouvel utilisateur avec un email valide", async () => {
      const input = {
        email: "newuser@example.com",
        password: "password123",
      };

      // pas d'utilisateur existant
      prisma.user.findUnique.mockResolvedValue(null);

      // résultat de la création
      prisma.user.create.mockResolvedValue({
        id: "user-123",
        email: input.email,
        password: expect.any(String), // N'importe quel string (le hash)
        role: "USER",
      });

      //appel de la fonction de register avec les infos user
      const result = await authService.register(input);

      //verifier le resultat
      expect(result).toEqual({
        id: "user-123",
        email: "newuser@example.com",
        role: "USER",
      });

      // Vérifier que findUnique a été appelé avec l'email
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });

      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("devrait lancer une ConflictError si l'email existe déjà", async () => {
      // ARRANGE
      const input = {
        email: "existing@example.com",
        password: "password123",
      };

      // utilisateur existant retourné
      prisma.user.findUnique.mockResolvedValue({
        id: "existing-user-id",
        email: "existing@example.com",
        password: "hashed_password",
        role: "USER",
      });

      // ACT & ASSERT
      await expect(authService.register(input)).rejects.toThrow(ConflictError);

      // Vérifier que create n'a pas été appelé (pas de création)
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("login()", () => {
    it("devrait connecter un utilisateur avec des identifiants valides", async () => {
      // ARRANGE
      const input = {
        email: "user@example.com",
        password: "correctpassword123",
      };

      // Créer un vrai hash du password 
      const hashedPassword = await hash(input.password, 10);

      // Mock : aucun restaurant/admin avec cet email
      prisma.restaurant.findUnique.mockResolvedValue(null);
      prisma.admin.findUnique.mockResolvedValue(null);

      // Mock : utilisateur avec le bon hash
      prisma.user.findUnique.mockResolvedValue({
        id: "user-456",
        email: input.email,
        password: hashedPassword,
        role: "USER",
      });

      // ACT
      const result = await authService.login(input);

      // ASSERT
      expect(result).toEqual({
        id: "user-456",
        email: "user@example.com",
        role: "USER",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
    });

    it("devrait lancer une UnauthorizedError si l'utilisateur n'existe pas", async () => {
      // ARRANGE
      const input = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // Mock : aucun utilisateur/restaurant/admin trouvé
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.restaurant.findUnique.mockResolvedValue(null);
      prisma.admin.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(authService.login(input)).rejects.toThrow(UnauthorizedError);
    });

    it("devrait lancer une UnauthorizedError si le mot de passe est incorrect", async () => {
      // ARRANGE
      const input = {
        email: "user@example.com",
        password: "wrongpassword",
      };

      // Créer un hash avec un password différent
      const hashedPassword = await hash("correctpassword", 10);


      // Mock : aucun restaurant/admin, user avec mauvais hash
      prisma.restaurant.findUnique.mockResolvedValue(null);
      prisma.admin.findUnique.mockResolvedValue(null);

      prisma.user.findUnique.mockResolvedValue({
        id: "user-789",
        email: input.email,
        password: hashedPassword, // Hash d'un autre password
        role: "USER",
      });

      // ACT & ASSERT
      await expect(authService.login(input)).rejects.toThrow(UnauthorizedError);
    });
  });
});
