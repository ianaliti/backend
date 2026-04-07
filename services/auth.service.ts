import type { PrismaClient } from "../generated/prisma/client.js";
import { hash, compare } from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../common/exceptions.js";
import { Role } from "../generated/prisma/client.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: Role;
}

export default class AuthService {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  register = async (input: RegisterInput): Promise<AuthResponse> => {
    //1. recuperer l'utilisateur avec l'email en base de données

    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    //2. si l'utilisateur existe déjà, throw une erreur de conflit
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    //3. hasher le mot de passe avec la fonction hash (nombre de rounds recommandé : 10)
    const hashedPassword = await hash(input.password, 10);

    //4. créer l'utilisateur en base de données avec le mdp hashé
    const newUser = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.email.split("@")[0],
        password: hashedPassword,
        role: Role.USER,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
  };

  login = async (input: LoginInput): Promise<AuthResponse> => {
    //1. recuperer l'utilisateur avec l'email en base de données
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    //2. si l'utilisateur n'existe pas, throw une erreur d'Unauthorized
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }
    //3. comparer le mot de passe fourni avec le mot de passe hashé en base de données (utiliser la fonction compare de bcryptjs)
    const isPasswordValid = await compare(input.password, user.password);

    //4. si les mots de passe ne correspondent pas, throw une erreur d'Unauthorized
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  };
}
