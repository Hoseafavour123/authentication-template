import jwt from "jsonwebtoken";
import { client_url } from "./urls";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV !== "development",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    domain: client_url, // Set the domain and port
    path: "/",
    signed: true
  });
};

export default generateToken;
