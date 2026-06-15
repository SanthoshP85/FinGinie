/**
 * FinGinie Backend - Main Server Entry Point
 * Express.js + MongoDB + Pinecone + HuggingFace
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const documentRoutes = require("./routes/documentRoutes");
const userRoutes = require("./routes/userRoutes");
const goalRoutes = require("./routes/goalRoutes");

const app = express();

// Database connection state for serverless
let isConnected = false;
const connectOnce = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("Database connected");
  }
};

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api/", limiter);

// Database connection middleware (for serverless)
app.use(async (req, res, next) => {
  try {
    await connectOnce();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// Request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "FinGinie API",
    version: "1.0.0",
    description: "AI-powered financial assistant backend",
    endpoints: {
      auth: "/api/auth",
      chat: "/api/chat",
      documents: "/api/documents",
      user: "/api/user",
      goals: "/api/goals",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/goals", goalRoutes);

// Error handler middleware
app.use(errorHandler);

// Start server (only in local development)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`FinGinie server running on port ${PORT}`);
  });
}

module.exports = app;
