import { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { goalService } from "../services/services";

const CATEGORIES = [
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
  { value: "purchase", label: "Purchase" },
  { value: "debt", label: "Debt Payoff" },
  { value: "retirement", label: "Retirement" },
  { value: "education", label: "Education" },
  { value: "emergency", label: "Emergency Fund" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-secondary-500" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-red-600" },
];

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contributionSubmitting, setContributionSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributionGoal, setContributionGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "savings",
    targetAmount: "",
    currentAmount: "",
    currency: "INR",
    targetDate: "",
    priority: "medium",
    monthlyContribution: "",
    notes: "",
  });

  useEffect(() => {
    fetchGoals();
    fetchStats();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalService.getAll();
      setGoals(response.data.goals);
    } catch (err) {
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await goalService.getStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (editingGoal) {
        await goalService.update(editingGoal._id, {
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
        });
        setSuccess("Goal updated successfully");
      } else {
        await goalService.create({
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
        });
        setSuccess("Goal created successfully");
      }

      resetForm();
      fetchGoals();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      currency: goal.currency,
      targetDate: goal.targetDate ? goal.targetDate.split("T")[0] : "",
      priority: goal.priority,
      monthlyContribution: goal.monthlyContribution?.toString() || "",
      notes: goal.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      await goalService.delete(id);
      setGoals(goals.filter((g) => g._id !== id));
      setSuccess("Goal deleted");
      fetchStats();
    } catch (err) {
      setError("Failed to delete goal");
    }
  };

  const handleContribution = async (e) => {
    e.preventDefault();
    if (!contributionGoal || !contributionAmount) return;

    setContributionSubmitting(true);
    try {
      await goalService.addContribution(
        contributionGoal._id,
        parseFloat(contributionAmount),
      );
      setSuccess("Contribution added");
      setContributionGoal(null);
      setContributionAmount("");
      fetchGoals();
      fetchStats();
    } catch (err) {
      setError("Failed to add contribution");
    } finally {
      setContributionSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      title: "",
      description: "",
      category: "savings",
      targetAmount: "",
      currentAmount: "",
      currency: "USD",
      targetDate: "",
      priority: "medium",
      monthlyContribution: "",
      notes: "",
    });
  };

  const formatCurrency = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-primary-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-secondary-400";
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">
            Financial Goals
          </h1>
          <p className="text-secondary-600">
            Track and manage your financial goals
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Goal</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span className="text-sm">{success}</span>
          </div>
          <button onClick={() => setSuccess("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-2 text-secondary-500 mb-1">
              <Target size={16} />
              <span className="text-sm">Total Goals</span>
            </div>
            <p className="text-2xl font-bold text-secondary-800">
              {stats.totalGoals}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-2 text-secondary-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Active</span>
            </div>
            <p className="text-2xl font-bold text-secondary-800">
              {stats.activeGoals}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-2 text-secondary-500 mb-1">
              <CheckCircle size={16} />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats.completedGoals}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-2 text-secondary-500 mb-1">
              <DollarSign size={16} />
              <span className="text-sm">Progress</span>
            </div>
            <p className="text-2xl font-bold text-primary-600">
              {stats.overallProgress}%
            </p>
          </div>
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 size={32} className="animate-spin text-secondary-400" />
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-8 text-center">
          <Target size={48} className="mx-auto text-secondary-300 mb-3" />
          <p className="text-secondary-600">
            No goals yet. Create your first financial goal!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div
              key={goal._id}
              className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-secondary-800">
                    {goal.title}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full">
                    {CATEGORIES.find((c) => c.value === goal.category)?.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-1.5 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(goal._id)}
                    className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {goal.description && (
                <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
                  {goal.description}
                </p>
              )}

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary-600">
                    {formatCurrency(goal.currentAmount, goal.currency)}
                  </span>
                  <span className="font-medium text-secondary-800">
                    {formatCurrency(goal.targetAmount, goal.currency)}
                  </span>
                </div>
                <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(goal.progressPercentage)} transition-all`}
                    style={{
                      width: `${Math.min(100, goal.progressPercentage)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-secondary-500">
                    {goal.progressPercentage}% complete
                  </span>
                  <span
                    className={
                      PRIORITIES.find((p) => p.value === goal.priority)?.color
                    }
                  >
                    {PRIORITIES.find((p) => p.value === goal.priority)?.label}{" "}
                    priority
                  </span>
                </div>
              </div>

              {goal.targetDate && (
                <div className="flex items-center gap-1 text-xs text-secondary-500 mb-3">
                  <Calendar size={12} />
                  <span>
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <button
                onClick={() => setContributionGoal(goal)}
                className="w-full btn-secondary text-sm py-1.5"
              >
                Add Contribution
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-800">
                {editingGoal ? "Edit Goal" : "Create New Goal"}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-secondary-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Buy a car, Build emergency fund"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field"
                  rows={2}
                  placeholder="Describe your goal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="input-field"
                  >
                    {PRIORITIES.map((pri) => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Target Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: e.target.value })
                    }
                    className="input-field"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Current Amount
                  </label>
                  <input
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentAmount: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) =>
                      setFormData({ ...formData, targetDate: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Monthly Contribution
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyContribution: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input-field"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {editingGoal ? "Updating..." : "Creating..."}
                    </>
                  ) : editingGoal ? (
                    "Update Goal"
                  ) : (
                    "Create Goal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {contributionGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-800">
                Add Contribution
              </h2>
              <button
                onClick={() => {
                  setContributionGoal(null);
                  setContributionAmount("");
                }}
                className="p-1 hover:bg-secondary-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleContribution} className="p-4">
              <p className="text-sm text-secondary-600 mb-4">
                Adding contribution to:{" "}
                <strong>{contributionGoal.title}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setContributionGoal(null);
                    setContributionAmount("");
                  }}
                  disabled={contributionSubmitting}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contributionSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {contributionSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalsPage;
