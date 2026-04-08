POST
http://localhost:3000/api/auth/register
{
    "email": "iana@example.com",
    "password": "iana123"
}

POST
http://localhost:3000/api/auth/login

{
    "email": "iana@example.com",
    "password": "iana123"
}

GET
http://localhost:3000/api/auth/me

Authorization: Bearer <token>

POST
http://localhost:3000/api/auth/login
{
    "email":"admin@test.com",
    "password":"admin123"
}


POST
http://localhost:3000/api/restaurants

Authorization: Bearer <token>

{
  "email": "resto1@test.com",
  "password": "password123",
  "name": "Resto 1",
  "image": "https://example.com/resto.png"
}

POST
http://localhost:3000/api/auth/login
{
  "email": "resto1@test.com",
  "password": "password123"
}

GET 
http://localhost:3000/api/restaurants/me with token restaurant

PATCH http://localhost:3000/api/restaurants/me with token restaurant and with the token other user 

login as a restarant
POST /api/dishes with resto token

GET /api/restaurants/<restaurantId>/dishes
http://localhost:3000/api/restaurants/1a1bc24f-738c-42a6-be04-18f9f079d86f/dishes

GET
http://localhost:3000/api/dishes/50723968-78e7-496d-88f3-b78b19cf43a4 <dishId>

PATCH
http://localhost:3000/api/dishes/50723968-78e7-496d-88f3-b78b19cf43a4
{
  "price": 13.9,
  "isAvailable": true
}

POST /api/orders
{
  "restaurantId": "<restaurantId>",
  "deliveryAddress": "10 Rue de Paris",
  "items": [
    { "dishId": "<dish1>", "quantity": 2 },
    { "dishId": "<dish2>", "quantity": 1 }
  ]
}


POST http://localhost:3000/api/orders
with user token
{
  "restaurantId": "1a1bc24f-738c-42a6-be04-18f9f079d86f",
  "deliveryAddress": "10 Rue de Paris",
  "items": [
    { "dishId": "0c018e7b-b8ca-41af-8faa-5867b7b064e6", "quantity": 2 },
    { "dishId": "50723968-78e7-496d-88f3-b78b19cf43a4", "quantity": 1 }
  ]
}

GET /api/restaurants/me/orders with restaurantToken
GET /api/orders/:id with user token (owner)
PATCH /api/orders/:id/status with restaurantToken

{ "status": "CONFIRMED" }
{ "status": "PREPARING" }
{ "status": "READY" }
{ "status": "DELIVERED" }

DELETE /api/orders/:id