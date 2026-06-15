/**
 * User Routes
 */

const express = require("express");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get("/profile", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "Profile retrieved", { user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put("/profile", async (req, res, next) => {
  try {
    const { fullName, financialProfile, preferences } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (financialProfile) updateData.financialProfile = financialProfile;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "Profile updated", { user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/user/financial-profile
 * Update financial profile
 */
router.put("/financial-profile", async (req, res, next) => {
  try {
    const {
      monthlyIncome,
      monthlyExpenses,
      savingsGoal,
      riskTolerance,
      investmentHorizon,
    } = req.body;

    const financialProfile = {};
    if (monthlyIncome !== undefined)
      financialProfile["financialProfile.monthlyIncome"] = monthlyIncome;
    if (monthlyExpenses !== undefined)
      financialProfile["financialProfile.monthlyExpenses"] = monthlyExpenses;
    if (savingsGoal !== undefined)
      financialProfile["financialProfile.savingsGoal"] = savingsGoal;
    if (riskTolerance)
      financialProfile["financialProfile.riskTolerance"] = riskTolerance;
    if (investmentHorizon)
      financialProfile["financialProfile.investmentHorizon"] =
        investmentHorizon;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: financialProfile },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "Financial profile updated", { user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/user/password
 * Change password
 */
router.put("/password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, "Current and new password are required");
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, "Password must be at least 6 characters");
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, "Password updated successfully");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
