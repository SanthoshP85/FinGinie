/**
 * Document Model
 * Stores uploaded financial documents metadata
 */

const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["statement", "report", "tax", "invoice", "other"],
      default: "other",
    },
    vectorIds: [
      {
        type: String,
      },
    ],
    extractedText: {
      type: String,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processingError: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
documentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
