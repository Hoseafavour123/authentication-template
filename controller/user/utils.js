import express from "express";
import User from "../../model/user.js";
import Image from "../../model/image.js";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { isAuthenticated } from "../../middlewares/auth.js";
import ErrorHandler from "../../utils/ErrorHandler.js";
import pkg from "jsonwebtoken";
const { verify } = pkg;
const router = express.Router();

dotenv.config({
  path: "config/.env",
});

router.get("/route-activation", (req, res) => {
  const token = req.cookies.token;

  // console.log(token);

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // const secret = JWT_SECRET;
  // console.log(secret);

  try {
    // jwt.verify(token, process.env.JWT_SECRET_KEY)
    verify(token, process.env.JWT_SECRET_KEY);

    const response = {
      user: "Super Top Secret User",
    };

    console.log("verified");

    return res.status(200).json(response);
  } catch (e) {
    console.log("error...");
    return res.status(400).json({
      message: "Something went wrong",
    });
  }
});

router.get(
  "/getimage",
  // isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const token = req.cookies.token;
      // console.log(token);

      if (!token) {
        return res.status(401).json({ error: "Please login to continue" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      const images = await Image.find({ user_id: decoded.id });

      if (images.length === 0) {
        res.status(404).json({ error: "No images found for the user" });
        return;
      }

      const reversedImages = images.reverse(); // Reverse the order of images

      res.status(200).json({
        success: true,
        images: reversedImages,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/getfavouriteimage",
  // isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: "Please login to continue" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      const images = await Image.find({ user_id: decoded.id });

      if (images.length === 0) {
        console.log("No images found for the user");
        res.status(404).json({ error: "No images found for the user" });
        return;
      }

      const favouriteImages = images.filter(
        (image) => image.is_favourite === true
      );

      const reversedImages = favouriteImages.reverse(); // Reverse the order of images

      res.status(200).json({
        success: true,
        images: reversedImages,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-staff/:staffId",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const staffId = req.params.staffId;
      // Use the staffId in your code as needed
      
      // Example: Log the staffId
      console.log(staffId);

    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.delete("/deleteImage/:imageId", async (req, res, next) => {
  try {
    const imageId = req.params.imageId;

    // Find the image by ID and delete it
    const deletedImage = await Image.findByIdAndDelete(imageId);

    if (!deletedImage) {
      console.log("Image not found");
      res.status(404).json({ error: "Image not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export default router;
