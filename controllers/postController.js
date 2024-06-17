import multer from 'multer';
import sharp from 'sharp';

import { Post } from "../models/postModel.js";
import { Like } from "../models/post_likeModel.js";
import { Comment } from "../models/post_commentModel.js";

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, fn) => {
  if (file.mimetype.startsWith('image')) {
    fn(null, true)
  } else {
    fn(new AppError('Not an image. Please upload only images.', 400), false)
  }
}

const upload = multer({storage: multerStorage, fileFilter: multerFilter })

export class PostController {
  static uploadPostPhotos = upload.array('photos', 5);

  static resizePostPhotos = async (req, res, next) => {
    req.body.photos = [];
    console.log(req.files);
    if(!req.files) return next();

    await Promise.all(req.files.map(async (file, i) => {
      const filename = `post-${req.user.id}-${Date.now()}-${i + 1}.jpeg`
      await sharp(file.buffer).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/images/posts/${filename}`);
      req.body.photos.push(filename)
    }));

    next();
  }

  static async getAllPosts(req, res, next) {
    const posts = await Post.find().populate("likes").populate("comments").populate('user', 'username photo');
  
    res.status(200).json({
      status: "success",
      data: posts,
    });
  }

  static async createPost(req, res, next) {
    const { title, body, photos } = req.body;
    const newPost = await Post.create({ user: req.user._id, title, body, photos });

    res.status(200).json({
      status: "success",
      data: newPost,
    });
  }

  static async createLikeDislike(req, res, next) {
    const { post, like } = req.body;
    const newLike = await Like.create({ post, user: req.user._id, like });

    res.status(200).json({
      status: "success",
      data: newLike,
    });
  }

  static async createComment(req, res, next) {
    const { post, comment } = req.body;
    const newComment = await Comment.create({ post, user: req.user._id, comment });

    res.status(200).json({
      status: "success",
      data: newComment,
    });
  }
}
