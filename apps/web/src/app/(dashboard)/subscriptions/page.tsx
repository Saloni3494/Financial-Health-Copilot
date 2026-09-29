"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR, DEMO_MERCHANT_ID, API_BASE_URL } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import {
  CalendarDays,
  PlaySquare,
  Activity,
  ShoppingBag,
  Zap,
  Plus,
  X,
  CreditCard,
  AlertCircle
} from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  billing_cycle: "monthly" | "yearly" | "quarterly" | "weekly";
  next_billing_date: string;
  status: "active" | "paused" | "cancelled";
}

export default function SubscriptionsPage() {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "entertainment",
    amount: "",
    billing_cycle: "monthly",
    next_billing_date: "",
    status: "active",
  });

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscriptions/${DEMO_MERCHANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        amount: parseFloat(form.amount),
        billing_cycle: form.billing_cycle,
        next_billing_date: form.next_billing_date,
        status: form.status
      };

      const res = await fetch(`${API_BASE_URL}/api/subscriptions/${DEMO_MERCHANT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.showToast("Subscription added successfully", "success");
        setShowAdd(false);
        fetchSubscriptions();
        setForm({ name: "", category: "entertainment", amount: "", billing_cycle: "monthly", next_billing_date: "", status: "active" });
      }
    } catch {
      toast.showToast("Failed to add subscription", "error");
    } finally {
      setSaving(false);
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "entertainment": return <PlaySquare className="w-5 h-5 text-purple-500" />;
      case "health": return <Activity className="w-5 h-5 text-emerald-500" />;
      case "shopping": return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case "utilities": return <Zap className="w-5 h-5 text-amber-500" />;
      default: return <CalendarDays className="w-5 h-5 text-gray-500" />;
    }
  };

  const summary = useMemo(() => {
    let monthlyOutflow = 0;
    let yearlyOutflow = 0;
    
    subscriptions.forEach(sub => {
      if (sub.status !== 'active') return;
      
      let annualCost = 0;
      switch(sub.billing_cycle) {
        case "monthly": annualCost = sub.amount * 12; break;
        case "yearly": annualCost = sub.amount; break;
        case "quarterly": annualCost = sub.amount * 4; break;
        case "weekly": annualCost = sub.amount * 52; break;
      }
      
      yearlyOutflow += annualCost;
    });
    
    monthlyOutflow = yearlyOutflow / 12;

    return {
      monthlyOutflow,
      yearlyOutflow,
      activeCount: subscriptions.filter(s => s.status === 'active').length
    };
  }, [subscriptions]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-[#00BAF2]" />
            Recurring Bills & Subscriptions
          </h1>
          <p className="text-sm text-gray-500">Manage your subscriptions and recurring commitments in one place.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#00BAF2] hover:bg-[#0098C5] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#00BAF2]/20"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Average Monthly Outflow</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(summary.monthlyOutflow)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Projected Yearly Cost</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{formatINR(summary.yearlyOutflow)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Active Subscriptions</p>
          <p className="text-2xl font-bold text-[#00BAF2] mt-1">{summary.activeCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
            <p>No recurring payments added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {subscriptions.map(sub => (
              <div key={sub.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {getIconForCategory(sub.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {sub.name}
                      {sub.status !== 'active' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                          {sub.status}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {sub.category}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-x-8 gap-y-4 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className={`font-bold ${sub.status === 'active' ? 'text-gray-900' : 'text-gray-400'}`}>
                      {formatINR(sub.amount)}
                      <span className="text-xs font-normal text-gray-500"> /{sub.billing_cycle === 'monthly' ? 'mo' : sub.billing_cycle === 'yearly' ? 'yr' : 'cycle'}</span>
                    </p>
                  </div>
                  {sub.next_billing_date && sub.status === 'active' && (
                    <div className="text-left md:text-right min-w-[90px]">
                      <p className="text-xs text-gray-500">Next Billing</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1 justify-start md:justify-end">
                        {new Date(sub.next_billing_date) < new Date() && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        {new Date(sub.next_billing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="font-bold text-gray-900">Add Subscription</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <form id="add-sub-form" onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subscription Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Gym, Electricity"
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                    >
                      <option value="entertainment">Entertainment</option>
                      <option value="health">Health & Fitness</option>
                      <option value="shopping">Shopping</option>
                      <option value="utilities">Utilities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.billing_cycle}
                      onChange={e => setForm({...form, billing_cycle: e.target.value})}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      required
                      className="w-full pl-8 border-gray-200 rounded-xl text-sm"
                      value={form.amount}
                      onChange={e => setForm({...form, amount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Next Billing Date</label>
                    <input
                      type="date"
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.next_billing_date}
                      onChange={e => setForm({...form, next_billing_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="submit"
                form="add-sub-form"
                disabled={saving}
                className="w-full bg-[#00BAF2] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0098C5] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Subscription"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
