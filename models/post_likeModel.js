import mongoose from "mongoose";

const post_like = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: "Post",
    required: [true, "Like must belong to a Post"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Post must belong to a User"],
  },
  like: {
    type: Boolean,
    default: true,
  },
});

export const Like = mongoose.model("Like", post_like);
