/**
 * User Model
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    financialProfile: {
      monthlyIncome: { type: Number, default: 0 },
      monthlyExpenses: { type: Number, default: 0 },
      savingsGoal: { type: Number, default: 0 },
      riskTolerance: {
        type: String,
        enum: ["conservative", "moderate", "aggressive"],
        default: "moderate",
      },
      investmentHorizon: {
        type: String,
        enum: ["short", "medium", "long"],
        default: "medium",
      },
    },
    preferences: {
      currency: { type: String, default: "INR" },
      notifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
