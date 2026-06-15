/**
 * Goal Routes
 */

const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
  createGoal,
  getUserGoals,
  getGoalById,
  updateGoal,
  addContribution,
  deleteGoal,
  getGoalStats,
} = require("../services/goalService");
const { successResponse, errorResponse } = require("../utils/response");

const router = express.Router();

// All goal routes require authentication
router.use(authMiddleware);

/**
 * POST /api/goals
 * Create a new goal
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      targetAmount,
      currentAmount,
      currency,
      targetDate,
      priority,
      monthlyContribution,
      notes,
    } = req.body;

    if (!title || !targetAmount) {
      return errorResponse(res, 400, "Title and target amount are required");
    }

    const goal = await createGoal(req.userId, {
      title,
      description,
      category,
      targetAmount,
      currentAmount,
      currency,
      targetDate,
      priority,
      monthlyContribution,
      notes,
    });

    return successResponse(res, 201, "Goal created successfully", { goal });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals
 * Get all goals for user
 */
router.get("/", async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const goals = await getUserGoals(req.userId, { status, category });

    return successResponse(res, 200, "Goals retrieved", { goals });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/stats
 * Get goal statistics
 */
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await getGoalStats(req.userId);

    return successResponse(res, 200, "Goal statistics retrieved", { stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/:id
 * Get a single goal
 */
router.get("/:id", async (req, res, next) => {
  try {
    const goal = await getGoalById(req.userId, req.params.id);

    if (!goal) {
      return errorResponse(res, 404, "Goal not found");
    }

    return successResponse(res, 200, "Goal retrieved", { goal });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/goals/:id
 * Update a goal
 */
router.put("/:id", async (req, res, next) => {
  try {
    const goal = await updateGoal(req.userId, req.params.id, req.body);

    if (!goal) {
      return errorResponse(res, 404, "Goal not found");
    }

    return successResponse(res, 200, "Goal updated", { goal });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/goals/:id/contribute
 * Add contribution to a goal
 */
router.post("/:id/contribute", async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, 400, "Valid contribution amount is required");
    }

    const goal = await addContribution(req.userId, req.params.id, amount);

    if (!goal) {
      return errorResponse(res, 404, "Goal not found");
    }

    return successResponse(res, 200, "Contribution added", { goal });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteGoal(req.userId, req.params.id);

    if (!deleted) {
      return errorResponse(res, 404, "Goal not found");
    }

    return successResponse(res, 200, "Goal deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
