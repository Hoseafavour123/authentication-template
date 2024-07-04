import express from "express";
import dotenv from "dotenv";
import user from "./controller/user/user.js";
import booking from "./controller/user/booking.js";
import staff from "./controller/staff/staff.js";
import appointment from "./controller/staff/appointment.js";
import utils from "./controller/user/utils.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import User from "./model/user.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./utils/ErrorHandler.js";

export const app = express();

app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(
  cors({
    origin: "http://localhost:5173",
    // origin: "http://localhost:3000",

    credentials: true,
  })
);

app.use(express.json());
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "config/.env",
  });
}

app.use("/api/user", user, booking);
app.use("/api/staff", staff, appointment);
app.use("/api/utils", utils);

app.get("/get", async (req, res, next) => {
  // const signedCookies = req.signedCookies;
  // console.log("signed-cookies:", signedCookies);
  const token = req.cookies.token;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const user = await User.findById(decoded.id);

  res.send(decoded);
})
