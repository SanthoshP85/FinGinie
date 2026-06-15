/**
 * Goal Model
 * Stores user financial goals (multiple goals per user)
 */

const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "savings",
        "investment",
        "purchase",
        "debt",
        "retirement",
        "education",
        "emergency",
        "other",
      ],
      default: "savings",
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    targetDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },
    monthlyContribution: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
    },
    vectorId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });

// Virtual for progress percentage
goalSchema.virtual("progressPercentage").get(function () {
  if (this.targetAmount === 0) return 0;
  return Math.min(
    100,
    Math.round((this.currentAmount / this.targetAmount) * 100),
  );
});

// Virtual for remaining amount
goalSchema.virtual("remainingAmount").get(function () {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Include virtuals in JSON
goalSchema.set("toJSON", { virtuals: true });
goalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Goal", goalSchema);
