/**
 * Goal Service
 * Handles goal CRUD operations and vectorization for RAG
 */

const Goal = require("../models/Goal");
const { getPineconeService } = require("../utils/pineconeService");

/**
 * Create goal text for vectorization
 */
const createGoalText = (goal) => {
  const parts = [
    `Financial Goal: ${goal.title}`,
    goal.description ? `Description: ${goal.description}` : "",
    `Category: ${goal.category}`,
    `Target Amount: ${goal.currency} ${goal.targetAmount}`,
    `Current Savings: ${goal.currency} ${goal.currentAmount}`,
    `Progress: ${goal.progressPercentage}%`,
    goal.targetDate
      ? `Target Date: ${new Date(goal.targetDate).toLocaleDateString()}`
      : "",
    `Priority: ${goal.priority}`,
    `Status: ${goal.status}`,
    goal.monthlyContribution
      ? `Monthly Contribution: ${goal.currency} ${goal.monthlyContribution}`
      : "",
    goal.notes ? `Notes: ${goal.notes}` : "",
  ];

  return parts.filter(Boolean).join(". ");
};

/**
 * Vectorize goal for RAG retrieval
 */
const vectorizeGoal = async (goal) => {
  try {
    const pinecone = getPineconeService();
    const vectorId = `goal-${goal._id}`;
    const text = createGoalText(goal);

    await pinecone.upsertVector(vectorId, text, {
      type: "goal",
      goalId: goal._id.toString(),
      userId: goal.userId.toString(),
      category: goal.category,
      status: goal.status,
      priority: goal.priority,
    });

    // Update goal with vectorId
    goal.vectorId = vectorId;
    await goal.save();

    return vectorId;
  } catch (error) {
    console.error("Failed to vectorize goal:", error.message);
    return null;
  }
};

/**
 * Create a new goal
 */
const createGoal = async (userId, goalData) => {
  try {
    const goal = new Goal({
      userId,
      ...goalData,
    });

    await goal.save();

    // Vectorize for RAG
    await vectorizeGoal(goal);

    return goal;
  } catch (error) {
    console.error("Create goal error:", error);
    throw error;
  }
};

/**
 * Get all goals for a user
 */
const getUserGoals = async (userId, filters = {}) => {
  try {
    const query = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    const goals = await Goal.find(query).sort({ priority: -1, createdAt: -1 });

    return goals;
  } catch (error) {
    console.error("Get goals error:", error);
    throw error;
  }
};

/**
 * Get a single goal
 */
const getGoalById = async (userId, goalId) => {
  try {
    const goal = await Goal.findOne({ _id: goalId, userId });
    return goal;
  } catch (error) {
    console.error("Get goal error:", error);
    throw error;
  }
};

/**
 * Update a goal
 */
const updateGoal = async (userId, goalId, updateData) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (goal) {
      // Re-vectorize with updated data
      await vectorizeGoal(goal);
    }

    return goal;
  } catch (error) {
    console.error("Update goal error:", error);
    throw error;
  }
};

/**
 * Update goal progress (add contribution)
 */
const addContribution = async (userId, goalId, amount) => {
  try {
    const goal = await Goal.findOne({ _id: goalId, userId });

    if (!goal) {
      return null;
    }

    goal.currentAmount += amount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = "completed";
    }

    await goal.save();

    // Re-vectorize with updated progress
    await vectorizeGoal(goal);

    return goal;
  } catch (error) {
    console.error("Add contribution error:", error);
    throw error;
  }
};

/**
 * Delete a goal
 */
const deleteGoal = async (userId, goalId) => {
  try {
    const goal = await Goal.findOne({ _id: goalId, userId });

    if (!goal) {
      return false;
    }

    // Delete vector from Pinecone
    if (goal.vectorId) {
      const pinecone = getPineconeService();
      await pinecone.deleteVector(goal.vectorId);
    }

    await Goal.deleteOne({ _id: goalId });

    return true;
  } catch (error) {
    console.error("Delete goal error:", error);
    throw error;
  }
};

/**
 * Get goal statistics for a user
 */
const getGoalStats = async (userId) => {
  try {
    const goals = await Goal.find({ userId });

    const stats = {
      totalGoals: goals.length,
      activeGoals: goals.filter((g) => g.status === "active").length,
      completedGoals: goals.filter((g) => g.status === "completed").length,
      totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      overallProgress: 0,
      byCategory: {},
    };

    if (stats.totalTargetAmount > 0) {
      stats.overallProgress = Math.round(
        (stats.totalCurrentAmount / stats.totalTargetAmount) * 100,
      );
    }

    // Group by category
    goals.forEach((goal) => {
      if (!stats.byCategory[goal.category]) {
        stats.byCategory[goal.category] = {
          count: 0,
          totalTarget: 0,
          totalCurrent: 0,
        };
      }
      stats.byCategory[goal.category].count++;
      stats.byCategory[goal.category].totalTarget += goal.targetAmount;
      stats.byCategory[goal.category].totalCurrent += goal.currentAmount;
    });

    return stats;
  } catch (error) {
    console.error("Get goal stats error:", error);
    throw error;
  }
};

module.exports = {
  createGoal,
  getUserGoals,
  getGoalById,
  updateGoal,
  addContribution,
  deleteGoal,
  getGoalStats,
  vectorizeGoal,
};
