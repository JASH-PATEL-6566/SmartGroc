import User from "../../models/user.model";

interface SignupInput {
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const UserResolver = {
  Query: {
    getUsers: async () => {
      return await User.find({});
    },
    getUser: async (_: any, { id }: { id: string }) => {
      return await User.findById(id);
    },
  },
  Mutation: {
    // User Signup
    signup: async (_: any, { username, email, password }: SignupInput) => {
      if (!username || !email || !password) {
        throw new Error("All fields are required");
      }

      const newUser = new User({ username, email, password });
      await newUser.save();
      return newUser;
    },
    // User Login
    login: async (_: any, { email, password }: LoginInput) => {
      if (!email || !password) {
        throw new Error("All fields are required");
      }

      const user = await User.findOne({ email, password });
      return user;
    },
  },
};
