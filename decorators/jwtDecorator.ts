import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { UnauthorizedError, ForbiddenError } from "../common/exceptions.js";
import { Role } from "../generated/prisma/client.js";

export default fp(async function (fastify: FastifyInstance, options = {}) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  await fastify.register(fastifyJwt, {
    secret: jwtSecret,
  });

  fastify.decorate(
    "authenticate",
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        //1. verifier le token
        //2. extraire les infos du token et recuperer l'utilisateur correspondant dans la base de données
        //3. Throw une erreur si jamais le user n'est pas trouvé
        //4. Attacher l'utilisateur à la requete pour les prochaines middlewares ou handlers avec req.user = user
        //modifier le fichier types/fastify.d.ts pour typer req.user
        await req.jwtVerify();

        if (!req.user?.id || !req.user?.role) {
          throw new UnauthorizedError("Invalid token payload");
        }

        if (req.user.role === Role.USER) {
          const user = await fastify.prisma.user.findUnique({
            where: { id: req.user.id },
          });

          if (!user) {
            throw new UnauthorizedError("User not found");
          }

          req.user = { id: user.id, email: user.email, role: user.role };
          return;
        }

        if (req.user.role === Role.RESTAURANT) {
          const restaurant = await fastify.prisma.restaurant.findUnique({
            where: { id: req.user.id },
          });

          if (!restaurant) {
            throw new UnauthorizedError("Restaurant not found");
          }

          req.user = {
            id: restaurant.id,
            email: restaurant.email,
            role: restaurant.role,
          };
          return;
        }

        if (req.user.role === Role.ADMIN) {
          const admin = await fastify.prisma.admin.findUnique({
            where: { id: req.user.id },
          });

          if (!admin) {
            throw new UnauthorizedError("Admin not found");
          }

          req.user = { id: admin.id, email: admin.email, role: admin.role };
          return;
        }

        throw new UnauthorizedError("Unsupported role");
      } catch (err) {
        throw new UnauthorizedError();
      }
    },
  );

  fastify.decorate("authorize", (allowedRoles: Role[]) => {
    return async (req: FastifyRequest, res: FastifyReply) => {
      // D'abord authentifier l'utilisateur
      await fastify.authenticate(req, res);

      //todo: Vérifier que req.user.role est dans allowedRoles
      // Si le rôle de l'utilisateur n'est pas autorisé, throw une ForbiddenError
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError();
      }
    };
  });
});
