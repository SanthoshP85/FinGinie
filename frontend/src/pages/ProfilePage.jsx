import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/services";
import { Save, AlertCircle, CheckCircle, X, Loader2 } from "lucide-react";

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    monthlyIncome: "",
    monthlyExpenses: "",
    savingsGoal: "",
    riskTolerance: "moderate",
    investmentHorizon: "medium",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        monthlyIncome: user.financialProfile?.monthlyIncome || "",
        monthlyExpenses: user.financialProfile?.monthlyExpenses || "",
        savingsGoal: user.financialProfile?.savingsGoal || "",
        riskTolerance: user.financialProfile?.riskTolerance || "moderate",
        investmentHorizon: user.financialProfile?.investmentHorizon || "medium",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await userService.updateProfile({
        fullName: profile.fullName,
        financialProfile: {
          monthlyIncome: parseFloat(profile.monthlyIncome) || 0,
          monthlyExpenses: parseFloat(profile.monthlyExpenses) || 0,
          savingsGoal: parseFloat(profile.savingsGoal) || 0,
          riskTolerance: profile.riskTolerance,
          investmentHorizon: profile.investmentHorizon,
        },
      });
      updateUser(response.data.user);
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwords.new !== passwords.confirm) {
      setError("New passwords do not match");
      return;
    }

    if (passwords.new.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await userService.changePassword(passwords.current, passwords.new);
      setSuccess("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-800">Profile</h1>
        <p className="text-secondary-600">Manage your account settings</p>
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

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">
          Personal Information
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) =>
                setProfile({ ...profile, fullName: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              className="input-field bg-secondary-50"
              disabled
            />
          </div>

          <hr className="my-6" />

          <h3 className="text-md font-semibold text-secondary-800">
            Financial Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Monthly Income
              </label>
              <input
                type="number"
                value={profile.monthlyIncome}
                onChange={(e) =>
                  setProfile({ ...profile, monthlyIncome: e.target.value })
                }
                className="input-field"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Monthly Expenses
              </label>
              <input
                type="number"
                value={profile.monthlyExpenses}
                onChange={(e) =>
                  setProfile({ ...profile, monthlyExpenses: e.target.value })
                }
                className="input-field"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Savings Goal
              </label>
              <input
                type="number"
                value={profile.savingsGoal}
                onChange={(e) =>
                  setProfile({ ...profile, savingsGoal: e.target.value })
                }
                className="input-field"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Risk Tolerance
              </label>
              <select
                value={profile.riskTolerance}
                onChange={(e) =>
                  setProfile({ ...profile, riskTolerance: e.target.value })
                }
                className="input-field"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Investment Horizon
              </label>
              <select
                value={profile.investmentHorizon}
                onChange={(e) =>
                  setProfile({ ...profile, investmentHorizon: e.target.value })
                }
                className="input-field"
              >
                <option value="short">Short Term (1-3 years)</option>
                <option value="medium">Medium Term (3-7 years)</option>
                <option value="long">Long Term (7+ years)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {profileLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Form */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
