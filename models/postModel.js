import mongoose from "mongoose";
import { Like } from "./post_likeModel.js";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Post must belong to a User"],
    },
    title: {
      type: String,
      required: [true, "Posts must have a title"],
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Post must have a body"],
      trim: true,
    },
    photos: [String],
    // likes: Number,
    // dislikes: Number,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: true,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

postSchema.virtual("likes", {
  ref: "Like",
  foreignField: "post",
  localField: "_id",
});

postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

// postSchema.virtual("likesssss").get(function () {
//   let dislikes = 0;
//   let likes = 0;
//   Like.aggregate([{ $match: { post: this._id } }, { $group: { _id: "$like", count: { $sum: 1 } } }])
//     .then((res) => {
//       likes = res.at(0).count;
//       dislikes = res.at(1).count;
//     })
//     .catch((err) => console.log(err));

//   return { likes, dislikes };
//   // Like.aggregate([
//   //   { $match: { post: { $eq: this._id } } },
//   //   { $group: { _id: "$like", count: { $sum: 1 } } },
//   // ])
//   //   .then((res) => console.log(res))
//   //   .catch((err) => console.log(err));
// });

export const Post = mongoose.model("Post", postSchema);
