/**
 * Document Routes
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const authMiddleware = require("../middleware/auth");
const {
  uploadDocument,
  getUserDocuments,
  deleteDocument,
} = require("../services/documentService");
const { successResponse, errorResponse } = require("../utils/response");

const router = express.Router();

// Use memory storage for serverless (Vercel) or disk storage for local
const isServerless = process.env.NODE_ENV === "production";

let storage;
if (isServerless) {
  // Use memory storage for serverless environments
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `document-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "text/plain"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and TXT files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All document routes require authentication
router.use(authMiddleware);

/**
 * POST /api/documents/upload
 * Upload a document
 */
router.post("/upload", upload.single("document"), async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, "No file uploaded");
    }

    const { category } = req.body;
    const document = await uploadDocument(req.userId, req.file, category);

    return successResponse(res, 201, "Document uploaded successfully", {
      document: {
        id: document._id,
        filename: document.originalName,
        category: document.category,
        size: document.size,
        isProcessed: document.isProcessed,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents
 * Get all user documents
 */
router.get("/", async (req, res, next) => {
  try {
    const documents = await getUserDocuments(req.userId);

    return successResponse(res, 200, "Documents retrieved", {
      documents: documents.map((doc) => ({
        id: doc._id,
        filename: doc.originalName,
        category: doc.category,
        size: doc.size,
        isProcessed: doc.isProcessed,
        processingError: doc.processingError,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteDocument(req.userId, id);

    if (!deleted) {
      return errorResponse(res, 404, "Document not found");
    }

    return successResponse(res, 200, "Document deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
