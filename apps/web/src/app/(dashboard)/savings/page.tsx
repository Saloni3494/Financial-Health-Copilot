"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR, DEMO_MERCHANT_ID, API_BASE_URL } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import {
  PiggyBank,
  Target,
  Plane,
  Home,
  ShieldCheck,
  Plus,
  X,
  TrendingUp,
  Award
} from "lucide-react";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
}

interface SavingsData {
  monthly_income: number;
  monthly_expenses: number;
  savings_rate: number;
  goals: Goal[];
}

export default function SavingsPage() {
  const toast = useToast();
  const [data, setData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
    category: "general"
  });

  const [showUpdateRate, setShowUpdateRate] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [rateForm, setRateForm] = useState({
    monthly_income: "",
    monthly_expenses: ""
  });

  const fetchSavings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/savings/${DEMO_MERCHANT_ID}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.savings);
        if (json.savings) {
          setRateForm({
            monthly_income: json.savings.monthly_income.toString(),
            monthly_expenses: json.savings.monthly_expenses.toString()
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.target_amount) return;
    
    setSavingGoal(true);
    try {
      const payload = {
        name: goalForm.name,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: parseFloat(goalForm.current_amount || "0"),
        deadline: goalForm.deadline,
        category: goalForm.category
      };

      const res = await fetch(`${API_BASE_URL}/api/savings/${DEMO_MERCHANT_ID}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.showToast("Goal added successfully", "success");
        setShowAddGoal(false);
        fetchSavings();
        setGoalForm({ name: "", target_amount: "", current_amount: "", deadline: "", category: "general" });
      }
    } catch {
      toast.showToast("Failed to add goal", "error");
    } finally {
      setSavingGoal(false);
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.monthly_income || !rateForm.monthly_expenses) return;
    
    setSavingRate(true);
    try {
      const payload = {
        monthly_income: parseFloat(rateForm.monthly_income),
        monthly_expenses: parseFloat(rateForm.monthly_expenses)
      };

      const res = await fetch(`${API_BASE_URL}/api/savings/${DEMO_MERCHANT_ID}/update_rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.showToast("Savings Rate updated", "success");
        setShowUpdateRate(false);
        fetchSavings();
      }
    } catch {
      toast.showToast("Failed to update rate", "error");
    } finally {
      setSavingRate(false);
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "travel": return <Plane className="w-5 h-5 text-blue-500" />;
      case "home": return <Home className="w-5 h-5 text-emerald-500" />;
      case "safety": return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      default: return <Target className="w-5 h-5 text-amber-500" />;
    }
  };

  if (loading || !data) {
    return <div className="p-10 text-center text-gray-500">Loading savings data...</div>;
  }

  const surplus = data.monthly_income - data.monthly_expenses;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PiggyBank className="w-7 h-7 text-[#00BAF2]" />
            Savings Behavior & Goals
          </h1>
          <p className="text-sm text-gray-500">Track your savings rate, monthly surplus, and financial goals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpdateRate(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
          >
            Update Income/Exp
          </button>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 bg-[#00BAF2] hover:bg-[#0098C5] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#00BAF2]/20"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Monthly Savings Rate</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-3xl font-bold ${data.savings_rate >= 20 ? 'text-emerald-600' : data.savings_rate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
              {data.savings_rate}%
            </p>
            <p className="text-xs text-gray-400 mb-1">Target: >20%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Monthly Surplus</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(surplus)}</p>
          <p className="text-xs text-gray-400 mt-1">Income: {formatINR(data.monthly_income)}</p>
        </div>
        <div className="bg-[#002e6e] p-5 rounded-2xl border border-[#003886] shadow-sm text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-blue-200 font-medium">Active Goals</p>
              <p className="text-3xl font-bold mt-1">{data.goals.length}</p>
            </div>
            <Award className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Your Financial Goals</h2>
        </div>
        
        {data.goals.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Target className="w-12 h-12 mb-3 opacity-20" />
            <p>No financial goals set yet. Start saving!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 p-2">
            {data.goals.map(goal => {
              const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
              return (
                <div key={goal.id} className="p-4 hover:bg-gray-50 transition-colors rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                        {getIconForCategory(goal.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-xs text-gray-500">Target: {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{progress}% Achieved</p>
                      <p className="text-xs text-gray-500">{formatINR(goal.current_amount)} / {formatINR(goal.target_amount)}</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-2.5 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-[#00BAF2]'}`}
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">Add Savings Goal</h2>
              <button onClick={() => setShowAddGoal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="add-goal-form" onSubmit={handleAddGoal} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund"
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={goalForm.name}
                  onChange={e => setGoalForm({...goalForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={goalForm.category}
                  onChange={e => setGoalForm({...goalForm, category: e.target.value})}
                >
                  <option value="general">General Savings</option>
                  <option value="safety">Emergency / Safety</option>
                  <option value="travel">Travel</option>
                  <option value="home">Home Purchase</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    required
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={goalForm.target_amount}
                    onChange={e => setGoalForm({...goalForm, target_amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Already Saved</label>
                  <input
                    type="number"
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={goalForm.current_amount}
                    onChange={e => setGoalForm({...goalForm, current_amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Deadline</label>
                <input
                  type="date"
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={goalForm.deadline}
                  onChange={e => setGoalForm({...goalForm, deadline: e.target.value})}
                />
              </div>
              
              <button
                type="submit"
                disabled={savingGoal}
                className="w-full bg-[#00BAF2] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0098C5] disabled:opacity-50"
              >
                {savingGoal ? "Saving..." : "Save Goal"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showUpdateRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">Update Monthly Cash Flow</h2>
              <button onClick={() => setShowUpdateRate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateRate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Average Monthly Income</label>
                <input
                  type="number"
                  required
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={rateForm.monthly_income}
                  onChange={e => setRateForm({...rateForm, monthly_income: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Average Monthly Expenses</label>
                <input
                  type="number"
                  required
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={rateForm.monthly_expenses}
                  onChange={e => setRateForm({...rateForm, monthly_expenses: e.target.value})}
                />
              </div>
              
              <button
                type="submit"
                disabled={savingRate}
                className="w-full bg-[#00BAF2] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0098C5] disabled:opacity-50 mt-2"
              >
                {savingRate ? "Updating..." : "Update Savings Rate"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
