import type { PrismaClient } from "../generated/prisma/client.js";
import { hash, compare } from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../common/exceptions.js";

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
  role: string;
}

export default class AuthService {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  register = async (input: RegisterInput): Promise<AuthResponse> => {
    //1. recuperer l'utilisateur avec l'email en base de données

    //2. si l'utilisateur existe déjà, throw une erreur de conflit

    //3. hasher le mot de passe avec la fonction hash (nombre de rounds recommandé : 10)

    //4. créer l'utilisateur en base de données avec le mdp hashé

    return {
      id: "a remplacer par l'id de l'utilisateur créé",
      email: "a remplacer par l'email de l'utilisateur créé",
      role: "a remplacer par le rôle de l'utilisateur créé",
    };
  };

  login = async (input: LoginInput): Promise<AuthResponse> => {
    //1. recuperer l'utilisateur avec l'email en base de données

    //2. si l'utilisateur n'existe pas, throw une erreur d'Unauthorized
    //3. comparer le mot de passe fourni avec le mot de passe hashé en base de données (utiliser la fonction compare de bcryptjs)

    //4. si les mots de passe ne correspondent pas, throw une erreur d'Unauthorized

    return {
      id: "a remplacer par l'id de l'utilisateur connecté",
      email: "a remplacer par l'email de l'utilisateur connecté",
      role: "a remplacer par le rôle de l'utilisateur connecté",
    };
  };
}
