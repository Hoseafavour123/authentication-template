import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import User from "../model/user.js";
import Staff from "../model/staff.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const signedCookies = req.signedCookies;
  // console.log('signed-cookies:', signedCookies);
  const token = req.cookies.u_token;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // check if the access token is expired
  if (decoded.exp && decoded.exp <= Date.now() / 1000) {
    try {
      await updateAccessToken(req, res, next);
    } catch (error) {
      return next(error);
    }
  } else {
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    req.user = user;

    next();
  }
});

export const isStaffAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const signedCookies = req.signedCookies;
  // console.log('signed-cookies:', signedCookies);
  const token = req.cookies.s_token;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // check if the access token is expired
  if (decoded.exp && decoded.exp <= Date.now() / 1000) {
    try {
      await updateAccessToken(req, res, next);
    } catch (error) {
      return next(error);
    }
  } else {
    const user = await Staff.findById(decoded.id);

    if (!user) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    req.user = user;

    next();
  }
});