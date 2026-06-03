# UberEats API

A REST + GraphQL + WebSocket backend for a food delivery platform, built with Fastify, Prisma, and MariaDB.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Fastify 5 |
| ORM | Prisma 7 (MariaDB) |
| Auth | JWT (`@fastify/jwt`) |
| Validation | TypeBox + JSON Schema |
| API Docs | Swagger (`/docs`) |
| GraphQL | Mercurius |
| Real-time | WebSocket (`@fastify/websocket`) |
| Tests | Vitest |
| Container | Docker |

---

## Getting Started

### With Docker

```bash
docker compose up
```

API runs at `http://localhost:3000`. Swagger UI at `http://localhost:3000/docs` (development only).

### Local Development

```bash
npm install
npx prisma generate
npm run dev
```

Requires a `.env` file with:

```env
DATABASE_URL="mysql://user:password@localhost:3307/ubereats"
JWT_SECRET="your-secret"
PORT=3000
NODE_ENV=development
```

---

## Entry Point — `index.ts`

The boot sequence is order-sensitive:

```
Create Fastify instance (logger: true)
  → Global error handler (RFC 7807)
  → GET /health
  → start():
      CORS
      Swagger (dev only)
      registerPlugins()   ← DB + JWT + WebSocket
      registerGraphQL()
      registerRoutes()
      listen()
```

`__filename` / `__dirname` are reconstructed manually at the top because this project uses ES Modules (`"type": "module"`), where they don't exist natively.

---

## Plugins — `plugins/`

Fastify uses plugin encapsulation: each plugin runs in its own scope. `registerPlugins` is called **before** routes so everything registered inside (Prisma, JWT, WebSocket) is available as server decorators when routes load.

| Plugin | What it provides |
|---|---|
| `prismaPlugin` | `server.prisma` — single shared DB connection |
| `jwtDecorator` | `server.jwt`, `server.authenticate` |
| `@fastify/websocket` | WebSocket upgrade support for routes |
| `dotenvx` | Loads `.env` before anything else reads `process.env` |

---

## Data Model — `prisma/schema.prisma`

```
User ──────┐
           ├──> Order ──> OrderItem ──> Plat
Restaurant ┤                              │
           └──> Rating                    │
                                          │
           Restaurant <────────────────── ┘
```

| Model | Key fields |
|---|---|
| `User` | `id`, `email`, `password`, `role` (USER / ADMIN / RESTAURANT) |
| `Restaurant` | `id`, `name`, `cuisine`, `city`, `isActive`, `averageRating` |
| `Plat` | `id`, `restaurantId`, `name`, `price`, `category`, `isAvailable` |
| `Order` | `id`, `userId`, `restaurantId`, `status`, `totalPrice`, `deliveryAddress` |
| `OrderItem` | `orderId`, `platId`, `quantity`, `unitPrice`, `subtotal` |
| `Rating` | `userId`, `restaurantId`, `score`, `comment` |

`OrderStatus` enum: `PENDING → CONFIRMED → PREPARING → READY → DELIVERED` (or `CANCELLED`)

---

## Routes — `routes/`

All REST routes live under `/api`:

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                          (authenticated)

GET    /api/restaurants
POST   /api/restaurants
GET    /api/restaurants/me                   (restaurant token)
PATCH  /api/restaurants/me                   (restaurant token)
GET    /api/restaurants/:id/dishes

POST   /api/dishes                           (restaurant token)
GET    /api/dishes/:id
PATCH  /api/dishes/:id                       (restaurant token)
DELETE /api/dishes/:id                       (restaurant token)

POST   /api/orders                           (user token)
GET    /api/restaurants/me/orders            (restaurant token)
GET    /api/orders/:id                       (owner)
PATCH  /api/orders/:id/status                (restaurant token)
DELETE /api/orders/:id

GET    /api/users/me                         (user token)
PATCH  /api/users/me                         (user token)
DELETE /api/users/me                         (user token)

GET    /ws/restaurant                        WebSocket
POST   /graphql                              GraphQL
```

Every route follows the same pattern — schema validates input and generates Swagger docs, handler calls a service, service talks to Prisma:

```typescript
app.post<{ Body: RegisterRequest }>("/register", {
  schema: { body: RegisterSchema, response: { 201: TokenResponseSchema } }
}, async (request, reply) => {
  const result = await service.register(request.body);
  return reply.status(201).send(result);
});
```

---

## Schemas — `schemas/`

Input/output shapes are defined with [TypeBox](https://github.com/sinclairzx81/typebox), producing JSON Schema. The same schema is used for:

1. Runtime request validation (Fastify)
2. TypeScript type inference (handler params)
3. Swagger spec generation (auto-docs)

```typescript
export const RegisterSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
  name: Type.Optional(Type.String()),
});
```

---

## Services — `services/`

Business logic lives in services, separated from route handlers. Services receive `prisma` through the constructor and throw typed `AppError` subclasses on failure.

Example — `POST /api/auth/register` full lifecycle:

```
Route handler
  → AuthService.register(body)
      → Check email not taken  (throws ConflictError 409 if taken)
      → bcrypt.hash(password)
      → prisma.user.create(...)
      → return user
  → Route signs JWT  { expiresIn: "7d" }
  → 201 { token }
```

---

## Error Handling — `common/exceptions.ts`

All errors use [RFC 7807 Problem Details](https://www.rfc-editor.org/rfc/rfc7807):

```json
{
  "type": "urn:app:error:not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Dish not found",
  "instance": "/api/dishes/abc"
}
```

Available error classes: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `TooManyRequestsError` (429).

Fastify validation errors (`FST_ERR_VALIDATION`) are also caught and formatted into RFC 7807 with per-field details:

```json
{
  "type": "urn:app:error:validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "body/email must match format \"email\"",
  "instance": "/api/auth/register"
}
```

---

## Brute-Force Protection

`POST /api/auth/login` tracks failed attempts per IP in memory:

- Each failure adds an exponential soft delay before the next attempt (1s → 2s → 4s → 8s)
- After 5 failures in a 1-minute window: 15-minute hard block
- Returns `429` with a `Retry-After` header in both cases
- Successful login clears the tracker for that IP

---

## WebSocket — `routes/websocket.ts`

Restaurants connect to `GET /ws/restaurant` to receive real-time order notifications.

Connection handshake:

```
Client connects
  → sends { event: "authenticate", token: "<jwt>" }
  → server verifies token, checks role === RESTAURANT
  → registers connection in websocket.service.ts
  → sends { event: "connected", restaurantId, message }

On new order → server pushes order data to the restaurant's socket
On disconnect → connection is unregistered
```

Ping/pong keepalive: `{ event: "ping" }` → `{ event: "pong", timestamp }`.

---

## GraphQL — `graphql/`

Powered by [Mercurius](https://mercurius.dev). Provides an alternative query interface for restaurant data alongside REST — useful when the frontend needs flexible, nested queries without multiple round trips.

- Schema: `graphql/restaurant.schema.ts`
- Resolvers: `graphql/restaurant.resolvers.ts`
- GraphiQL playground at `/graphiql` (development)

GraphQL routes are hidden from the Swagger spec.

---

## Tests — `__tests__/`

```
__tests__/
  unit/
    auth.service.test.ts       # service logic with mocked Prisma
  integration/
    auth.integration.test.ts   # full HTTP request/response against real routes
  setup.ts
  utils/
```

```bash
npm test                  # run once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

---

## Docker

```bash
docker compose up --build   # first run
docker compose up           # subsequent runs
```

The Dockerfile builds a production image of the API. `docker compose` also starts the MariaDB container on port `3307`.
