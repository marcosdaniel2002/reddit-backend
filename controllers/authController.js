import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { Email } from "../utils/email.js";

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = function (user, statusCode, req, res) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  if (process.env.NODE_ENV === "development") cookieOptions.secure = true

  res.cookie("jwt", token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

export class AuthController {
  static async signUp(req, res) {
    const { name, email,  username, password, passwordConfirm } = req.body;
    const newUser = await User.create({
      name,
      email,
      username,
      password,
      passwordConfirm,
    });

    createSendToken(newUser, 201, req, res);
  }

  static async login(req, res, next) {
    const { email, password } = req.body;

    // 1) CHECK EMAIL AN PASSWORD
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // 2) CHECK IF USER EXISTS && PASSWORD IS CORRECT
    const user = await User.findOne({ email }).select("+password");
    const correct = await user?.correctPassword(password, user.password);

    if (!correct) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // 3) IF EVERYTHING OK, SEND TOKEN TO CLIENT
    createSendToken(user, 200, req, res);
  }

  static async protect(req, res, next) {
    // 1) Getting token and check it's there
    let token = "";
    console.log(req.cookies);
    const { authorization } = req.headers;
    if (authorization && authorization.startsWith("Bearer")) {
      token = authorization.split(" ").at(1);
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } 

    if (!token) {
      return next(new AppError("You are not logged in! Please log in to get access", 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError("The user belonging to this token does no longer exist", 401));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError("User recently changed password! Please log in again.", 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  }

  static async forgotPassword(req, res, next) {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError("There is not user with that email address.", 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email

    try {
      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/resetPassword/${resetToken}`;
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      console.log(err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError("There was an error sending the email. Try again later!", 500));
    }
  }

  static async resetPassword(req, res, next) {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set new password
    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, req, res);
  }

  static async updatePassword(req, res, next) {
    // 1) Get user from collection
    const { id } = req.user;
    const { password, newPassword, newPasswordConfirm } = req.body;
    const user = await User.findById(id).select("+password");

    // 2) Check if POSTED password is correct
    const correct = user?.correctPassword(password, user.password);
    if (!correct) {
      return next(new AppError("Password is not correct. Please put the correct password", 401));
    }

    // 3) If so, update password
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
  }

  static async getSession(req, res) {
    const {user} = req;
    res.status(200).json({
      status: "success",
      data: user,
    });
  }

  static async logout(req, res, next) {
    const cookieOptions = {
      maxAge: 1,
      httpOnly: true,
      sameSite: "none",
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    };

    if (process.env.NODE_ENV === "development") cookieOptions.secure = true

    res.cookie('jwt', '', cookieOptions);

    // res.clearCookie("jwt");

    res.status(200).json({
      status: 'success',
    })
  }
}
