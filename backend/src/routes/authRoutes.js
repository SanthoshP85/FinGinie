/**
 * Authentication Routes
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return errorResponse(
        res,
        400,
        "Email, password, and full name are required",
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, "Email already registered");
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      fullName,
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return successResponse(res, 201, "Registration successful", {
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 400, "Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return successResponse(res, 200, "Login successful", {
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/verify
 * Verify token
 */
router.get("/verify", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return errorResponse(res, 401, "User not found");
    }

    return successResponse(res, 200, "Token valid", { user });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Token expired");
    }
    return errorResponse(res, 401, "Invalid token");
  }
});

module.exports = router;
