//completer avec le schema GraphQL pour les restaurants
export const restaurantSchema = `
  type Restaurant {
    id: String!
    name: String!
    email: String!
    address: String
    createdAt: String!
    updatedAt: String!

    dishes: [Dish!]!
  }
  enum OrderStatus {
    PENDING
    CONFIRMED
    PREPARING
    READY
    DELIVERED
    CANCELLED
  }
    type Dish {
    id: String!
    name: String!
    description: String
    price: Float!
    restaurantId: String!
  }

  type OrderItem {
    id: String!
    orderId: String!
    dishId: String!
    quantity: Int!
    unitPrice: Float!
    subtotal: Float!
  }

  type Order {
    id: String!
    userId: String!
    restaurantId: String!
    status: OrderStatus!
    totalPrice: Float!
    deliveryAddress: String!
    createdAt: String!
    updatedAt: String!
    items: [OrderItem!]!
  }

  type Query {
    restaurants: [Restaurant!]!
    restaurant(id: String!): Restaurant
    myOrders: [Order!]!
    order(id: String!): Order
  }

  input OrderItemInput {
    dishId: String!
    quantity: Int!
  }

  input CreateOrderInput {
    restaurantId: String!
    items: [OrderItemInput!]!
    deliveryAddress: String
  }

   type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    
    cancelOrder(orderId: String!): Boolean!
  }
`;
