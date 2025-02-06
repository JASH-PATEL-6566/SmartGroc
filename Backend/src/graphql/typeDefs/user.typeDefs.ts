const userTypeDefs = `#graphql

    # User Model Schema
    type User{
        _id: ID!
        username: String!
        email: String!
        password: String!
        profilePicture: String
    }

    # User queries
    type Query {
        getUsers: [User!]
        getUser(id: ID!): User
    }

    # User mutations
    type Mutation {
        signup(input: SignupInput): User
        login(input: LoginInput): User
        updateUser(input: UpdateUserInput): User
    }

    # Input Types
    input SignupInput{
        username: String!
        email: String!
        password: String!
    }

    input LoginInput{
        email: String!
        password: String!
    }

    input UpdateUserInput{
        id: ID!
        username: String
        email: String
        password: String
        profilePicture: String
    }
`;

export default userTypeDefs;
