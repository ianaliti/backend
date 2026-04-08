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
http://localhost:3000/api/restaurants/me with <tokenRestaurant>

PATCH http://localhost:3000/api/restaurants/me with <tokenRestaurant> and with the token other user 

login as a restarant
POST /api/dishes with resto token
Authorization: Bearer <token>

GET http://localhost:3000/api/restaurants/<restaurantId>/dishes
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
with <userToken>
{
  "restaurantId": "1a1bc24f-738c-42a6-be04-18f9f079d86f",
  "deliveryAddress": "10 Rue de Paris",
  "items": [
    { "dishId": "0c018e7b-b8ca-41af-8faa-5867b7b064e6", "quantity": 2 },
    { "dishId": "50723968-78e7-496d-88f3-b78b19cf43a4", "quantity": 1 }
  ]
}

GET /api/restaurants/me/orders with <tokenRestaurant>
GET /api/orders/:id with <userToken> (owner)
PATCH /api/orders/:id/status with restaurantToken

{ "status": "CONFIRMED" }
{ "status": "PREPARING" }
{ "status": "READY" }
{ "status": "DELIVERED" }

DELETE /api/orders/:id

GET /api/users/me with Authorization: Bearer <userToken>

PATCH /api/users/me Authorization: Bearer <userToken> { "name": "New name" }
if use the other user email in the json; { "email": "user@example.com" } it returns 
{"type":"urn:app:error:conflict","title":"Conflict","status":409,"detail":"Email already used","instance":"/api/users/me"}


POST
http://localhost:3000/api/auth/register
{
  "email": "not-an-email",
  "password": "1"
}

{"type":"urn:app:error:validation","title":"Validation Error","status":400,"detail":"body/email must match format \"email\"","instance":"/api/auth/register"}

{
  "email": "email@gmail.com",
  "password": "1"
}

{"type":"urn:app:error:validation","title":"Validation Error","status":400,"detail":"body/password must NOT have fewer than 2 characters","instance":"/api/auth/register"}

GET /api/users/me with no token

{"type":"urn:app:error:unauthorized","title":"Unauthorized","status":401,"detail":"Invalid Access Token","instance":"/api/users/me"}


POST /api/dishes with user token
{"type":"urn:app:error:forbidden","title":"Forbidden","status":403,"detail":"Access Forbidden","instance":"/api/dishes"}

GET /api/dishes/id-kmfknlnfg
{"type":"urn:app:error:not-found","title":"Not Found","status":404,"detail":"Dish not found","instance":"/api/dishes/jfnwokfn"}