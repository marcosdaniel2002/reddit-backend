import express from "express";
import { PostController } from "../controllers/postController.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AuthController } from "../controllers/authController.js";

const router = express.Router();

router
  .route("/like")
  .post(catchAsync(AuthController.protect), catchAsync(PostController.createLikeDislike));

router
  .route("/comment")
  .post(catchAsync(AuthController.protect), catchAsync(PostController.createComment));

router
  .route("/")
  .get(catchAsync(PostController.getAllPosts))
  .post(catchAsync(AuthController.protect), PostController.uploadPostPhotos, catchAsync(PostController.resizePostPhotos), catchAsync(PostController.createPost));

export default router;
