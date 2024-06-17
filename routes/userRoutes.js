import express from "express";

import { UserController } from "../controllers/userController.js";
import { AuthController } from "../controllers/authController.js";
import { catchAsync } from "../utils/catchAsync.js";

const router = express.Router();

router.get('/getSession', catchAsync(AuthController.protect), catchAsync(AuthController.getSession))
router.get('/logout', catchAsync(AuthController.protect), catchAsync(AuthController.logout))

router.post("/signup", catchAsync(AuthController.signUp));
router.post("/login", catchAsync(AuthController.login));

router.post("/forgotPassword", catchAsync(AuthController.forgotPassword));
router.patch("/resetPassword/:token", catchAsync(AuthController.resetPassword));

router.patch(
  "/updateMyPassword",
  catchAsync(AuthController.protect),
  catchAsync(AuthController.updatePassword)
);
router.patch("/updateMe", catchAsync(AuthController.protect), UserController.uploadUserPhoto, catchAsync(UserController.resizeUserPhoto), catchAsync(UserController.updateMe));
router.delete("/deleteMe", catchAsync(AuthController.protect), catchAsync(UserController.deleteMe));

router
  .route("/")
  .get(catchAsync(AuthController.protect), catchAsync(UserController.getAllUsers))
  .post(UserController.createUser);

router.route("/:id").get(catchAsync(UserController.getUser));

export default router;
