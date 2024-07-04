import express from "express";
import Staff from "../../model/staff.js";
import jwt from "jsonwebtoken";
import sendMail from "../../utils/sendMail.js";
import sendToken from "../../utils/jwtToken.js";
import { isAuthenticated, isStaffAuthenticated } from "../../middlewares/auth.js";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import { client_url } from "../../utils/urls.js";
import dotenv from "dotenv";
import ErrorHandler from "../../utils/ErrorHandler.js";

dotenv.config({
  path: "config/.env",
});

const router = express.Router();

function generateOTP(length = 6) {
  const chars = "0123456789";
  let result = "";
  for (let i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }
    const userEmail = await Staff.findOne({ email });

    if (userEmail) {
      return res.status(400).json({ error: "User already exists" });
    }
    const code = generateOTP();

    const user = {
      name: name,
      email: email,
      password: password,
      code: code,
    };
    const otpToken = createOTPToken(user);

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        html: `<p>Your 2FA verification code is: <strong>${code}</strong></p>`,
      });
      const options = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        // httpOnly: true,
        sameSite: "none",
        // secure: true,
      };
      res
        .status(201)
        .cookie("code", otpToken, options)
        .json({
          success: true,
          message: `An OTP has been sent to ${user.email}`,
        });
    } catch (error) {
      return res.status(500).json({ error });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// create activation token
const createOTPToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "10m",
  });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { otpString } = req.body;
      // console.log(otpString);

      if (!otpString) {
        return res.status(400).json({ error: "Please pass in the otp value" });
      }

      const code = req.cookies.code;

      if (!code) {
        return res
          .status(401)
          .json({ error: "Please create an account or login to continue" });
      }

      const decoded = jwt.verify(code, process.env.ACTIVATION_SECRET);

      const decodedCode = parseInt(decoded.code);
      const otpStringAsInt = parseInt(otpString);

      if (decodedCode !== otpStringAsInt) {
        return res.status(400).json({ error: "Please input the correct code" });
      } else {
        const { name, email, password } = decoded;

        let user = await Staff.findOne({ email });

        if (user) {
          // Delete the 'code' cookie
          res.clearCookie("code");
          return res.status(400).json({ error: "User already exists" });
        }

        user = await Staff.create({
          name,
          email,
          password,
        });

        // Delete the 'code' cookie
        res.clearCookie("code");

        sendToken(user, 201, res);
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Please provide the all fields!" });
      }

      const user = await Staff.findOne({ email }).select("+password");

      if (!user) {
        res.status(400).json({ error: "User doesn't exists!" });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ error: "Please provide the correct password" });
      }

      sendToken(user, 201, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

//   try {
//     const { xgenriaemail, password } = req.body;
//     // Make API request to https://vectorai.xgenria.com/login-api
//     const xgenriaResponse = await axios.post(
//       "https://vectorai.xgenria.com/login-api",
//       {
//         email: xgenriaemail,
//         password,
//       }
//     );

//     if (
//       xgenriaResponse.data &&
//       xgenriaResponse.data.username &&
//       xgenriaResponse.data.email
//     ) {
//       const { username, email } = xgenriaResponse.data;

//       // Check if the user exists in your database
//       const user = await User.findOne({ email: email });

//       if (user) {
//         return sendToken(user, 201, res);
//       } else {
//         // User does not exist in your database
//         // Create the user in our database
//         try {
//           const user = await User.create({
//             name: username,
//             email,
//             password,
//           });
//           console.log("New user created!");
//           return sendToken(user, 201, res);
//         } catch (error) {
//           return res.status(400).json({ error: error.message });
//         }
//       }
//     } else {
//       return res.status(400).json({ error: "Invalid response data" });
//     }
//   } catch (error) {
//     // console.log(error.response.data.message);
//     return res.status(400).json({ error: error.response.data.message });
//   }
// });

// load user
router.get(
  "/get-user",
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await Staff.findById(req.user?._id);

      if (!user) {
        return res.status(400).json({ error: "User doesn't exists" });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", "", {
        expires: new Date(0),
        // httpOnly: true,
        sameSite: "none",
        // secure: true,
      });
      res.status(200).json({
        success: true,
        message: "Logout successful!",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { password, name } = req.body;
      if (!password || !name) {
        return res.status(400).json({ message: "Please fill all fields" });
      }
      const user = await Staff.findById(req.user?._id).select("+password");

      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "Please provide the correct password" });
      }

      user.name = name;

      await user.save();

      return res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
      // return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-user-password",
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.body.current_password || !req.body.new_password) {
        return res.status(400).json({ message: "Input all fields!" });
      }
      const user = await Staff.findById(req.user?._id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.current_password
      );

      if (!isPasswordMatched) {
        return res.status(400).json({ message: "Old password is incorrect!" });
      }

      if (req.body.current_password === req.body.new_password) {
        return res.status(400).json({ message: "Password has been used before!" });
      }
      user.password = req.body.new_password;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return res.status(500).json({ error:  error.message });
    }
  })
);

const createResetToken = (emailData) => {
  return jwt.sign(emailData, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if email exists in the database
    const user = await Staff.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }

    const emailData = {
      email: email,
    };

    const passwordResetToken = createResetToken(emailData);
    const resetUrl = `${client_url}/reset?r=${passwordResetToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Reset Your Password",
        html: `<p>Hello ${user.name}, please click on the button below to reset your password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>`,
      });
      return res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error sending reset email" });
  }
});

router.post(
  "/reset-token-verification",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { reset_password_token } = req.body;
      console.log(reset_password_token);
      const newResetToken = jwt.verify(
        reset_password_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newResetToken) {
        return res.status(400).json({ error: "Invalid token" });
      }
      res.status(200);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);

router.post("/reset-password", async (req, res, next) => {
  try {
    const { reset_password_token, newPassword, confirmPassword } = req.body;
    const decoded = jwt.verify(
      reset_password_token,
      process.env.ACTIVATION_SECRET
    );

    // Find the user by email
    const user = await Staff.findOne({ email: decoded.email });
    console.log(decoded);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (newPassword != confirmPassword) {
      return res.status(404).json({ error: "Password Unmatch" });
    }

    // Update user's password
    user.password = newPassword;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error resetting password" });
  }
});

export default router;
