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

const app = express();

// Lazy load routes to avoid initialization errors
let authRoutes, chatRoutes, documentRoutes, userRoutes, goalRoutes;

const loadRoutes = () => {
  if (!authRoutes) {
    authRoutes = require("./routes/authRoutes");
    chatRoutes = require("./routes/chatRoutes");
    documentRoutes = require("./routes/documentRoutes");
    userRoutes = require("./routes/userRoutes");
    goalRoutes = require("./routes/goalRoutes");
  }
};

// Database connection for serverless
const connectOnce = async () => {
  await connectDB();
};

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "https://fin-ginie.vercel.app",
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
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
    res
      .status(500)
      .json({ success: false, message: "Database connection failed" });
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

// API routes (lazy loaded)
app.use("/api/auth", (req, res, next) => {
  loadRoutes();
  authRoutes(req, res, next);
});
app.use("/api/chat", (req, res, next) => {
  loadRoutes();
  chatRoutes(req, res, next);
});
app.use("/api/documents", (req, res, next) => {
  loadRoutes();
  documentRoutes(req, res, next);
});
app.use("/api/user", (req, res, next) => {
  loadRoutes();
  userRoutes(req, res, next);
});
app.use("/api/goals", (req, res, next) => {
  loadRoutes();
  goalRoutes(req, res, next);
});

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
