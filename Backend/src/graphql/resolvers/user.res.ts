import User from "../../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface SignupInput {
  input: {
    username: string;
    email: string;
    password: string;
  };
}

interface LoginInput {
  input: {
    email: string;
    password: string;
  };
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
    // =================
    // User Signup
    // =================
    signup: async (_: any, { input }: SignupInput) => {
      const { username, email, password } = input;

      if (!username || !email || !password) {
        throw new Error("All fields are required");
      }

      const newUser = new User({
        username,
        email,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      });
      await newUser.save();
      return newUser;
    },
    // =================
    // User Login
    // =================
    login: async (_: any, { input }: LoginInput) => {
      const { email, password } = input;
      if (!email || !password) {
        throw new Error("All fields are required");
      }

      const user = await User.findOne({ email });

      if (user && bcrypt.compareSync(password, user?.password as string)) {
        const payload = {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
        };

        const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY as string, {
          expiresIn: "1d",
        });

        user.token = token;
        await user.save();

        // return the auth payload
        return {
          token,
          user: payload,
        };
      } else {
        return new Error("Email or password is incorrect!");
      }
    },
  },
};
