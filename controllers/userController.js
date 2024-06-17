import multer from 'multer';
import sharp from 'sharp';

import { User } from "../models/userModel.js";
import { AppError } from "../utils/appError.js";

// const multerStorage = multer.diskStorage({
//   destination: (req, file, fn) => {
//     fn(null, 'public/images/users');
//   }, 
//   filename: (req, file, fn) => {
//     // user-{userid}-{timestamp}.{ext}
//     const ext = file.mimetype.split('/')[1];
//     fn(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, fn) => {
  if (file.mimetype.startsWith('image')) {
    fn(null, true)
  } else {
    fn(new AppError('Not an image. Please upload only images.', 400), false)
  }
}

const upload = multer({storage: multerStorage, fileFilter: multerFilter })

export class UserController {
  static uploadUserPhoto = upload.single('photo');

  static resizeUserPhoto = async (req, res, next) => {
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/images/users/${req.file.filename}`);

    next();
  }

  static async getAllUsers(req, res, next) {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      data: users,
    });
  }

  static async getUser(req, res, next) {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError("No tour found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  }

  static createUser(req, res) {
    res.status(500).json({
      status: "error",
      message: "This route not yet defined! Please use /signup instead",
    });
  }

  static async updateMe(req, res, next) {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.newPassword) {
      return next(
        new AppError("This route is not for password updates. Please use /updateMyPassword", 400)
      );
    }

    // 2) Update user document
    const filterBody = {
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
    };
    
    if (req.file) filterBody.photo = req.file.filename;

    const updateUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updateUser,
      },
    });
  }

  static async deleteMe(req, res, next) {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }

  
}
