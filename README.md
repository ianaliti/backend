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

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQyYzk0YjU3LTMyODItMTFmMS04NDhiLWE2ZWZjZDQzNjA0NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NTU2Nzk0MX0.Pj5vlxZNSVBmUrXgV2flFOmjgwc2_dJDhXsNj7_hXF0"}

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