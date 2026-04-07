//completer avec le schema GraphQL pour les restaurants
export const restaurantSchema = `
  type Restaurant {
    id: String!
    name: String!
  }

  type Query {
    restaurants: [Restaurant!]!
    restaurant(id: String!): Restaurant
  }
`;
