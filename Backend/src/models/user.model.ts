import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "https://avatar.iran.liara.run/public/14",
    },
    dietary_prep:{
      type: [String!],
      default: []
    },
    allergic_to:{
      type: [String!],
      default: []
    },
    token:{
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
