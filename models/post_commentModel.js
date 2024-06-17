import mongoose from "mongoose";

const post_comment = new mongoose.Schema({
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
  comment: {
    type: String,
    required: [true, "Comment need to got a text"],
  },
});

export const Comment = mongoose.model("Comment", post_comment);
