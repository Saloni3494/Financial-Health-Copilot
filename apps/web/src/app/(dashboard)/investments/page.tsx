"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR, DEMO_MERCHANT_ID, API_BASE_URL } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import {
  TrendingUp,
  Landmark,
  PieChart,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Coins
} from "lucide-react";

interface Investment {
  id: string;
  name: string;
  type: string;
  invested_amount: number;
  current_value: number;
  monthly_sip?: number;
}

export default function InvestmentsPage() {
  const toast = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "mutual_fund",
    invested_amount: "",
    current_value: "",
    monthly_sip: "",
  });

  const fetchInvestments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/investments/${DEMO_MERCHANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        setInvestments(data.investments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.invested_amount || !form.current_value) return;
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        invested_amount: parseFloat(form.invested_amount),
        current_value: parseFloat(form.current_value),
        monthly_sip: form.monthly_sip ? parseFloat(form.monthly_sip) : 0
      };

      const res = await fetch(`${API_BASE_URL}/api/investments/${DEMO_MERCHANT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.showToast("Investment added successfully", "success");
        setShowAdd(false);
        fetchInvestments();
        setForm({ name: "", type: "mutual_fund", invested_amount: "", current_value: "", monthly_sip: "" });
      }
    } catch {
      toast.showToast("Failed to add investment", "error");
    } finally {
      setSaving(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "mutual_fund": return <PieChart className="w-5 h-5 text-purple-500" />;
      case "fixed_deposit": return <Landmark className="w-5 h-5 text-emerald-500" />;
      case "stocks": return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "gold": return <Coins className="w-5 h-5 text-amber-500" />;
      default: return <PieChart className="w-5 h-5 text-gray-500" />;
    }
  };

  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    
    investments.forEach(inv => {
      totalInvested += inv.invested_amount;
      totalCurrent += inv.current_value;
    });

    const totalReturn = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalReturn,
      returnPercentage
    };
  }, [investments]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[#00BAF2]" />
            Investments
          </h1>
          <p className="text-sm text-gray-500">Track your portfolio performance across all asset classes.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#00BAF2] hover:bg-[#0098C5] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#00BAF2]/20"
        >
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Current Portfolio Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(summary.totalCurrent)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Invested</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{formatINR(summary.totalInvested)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Returns</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-2xl font-bold ${summary.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.totalReturn >= 0 ? "+" : ""}{formatINR(summary.totalReturn)}
            </p>
            <p className={`text-sm mb-1 font-medium ${summary.totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              ({summary.returnPercentage.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading investments...</div>
        ) : investments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
            <p>No investments added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {investments.map(inv => {
              const returns = inv.current_value - inv.invested_amount;
              const retPct = inv.invested_amount > 0 ? (returns / inv.invested_amount) * 100 : 0;
              const isPositive = returns >= 0;

              return (
                <div key={inv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {getIconForType(inv.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{inv.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{inv.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500">Invested</p>
                      <p className="font-medium text-gray-900">{formatINR(inv.invested_amount)}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500">Current</p>
                      <p className="font-bold text-gray-900">{formatINR(inv.current_value)}</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-gray-500">Returns</p>
                      <div className={`flex items-center justify-end gap-1 font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(retPct).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">Add Investment</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Investment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Nifty 50 Fund"
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Asset Class</label>
                <select
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="stocks">Direct Stocks</option>
                  <option value="fixed_deposit">Fixed Deposit</option>
                  <option value="gold">Gold</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount Invested</label>
                  <input
                    type="number"
                    required
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={form.invested_amount}
                    onChange={e => setForm({...form, invested_amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    required
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={form.current_value}
                    onChange={e => setForm({...form, current_value: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monthly SIP (Optional)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={form.monthly_sip}
                  onChange={e => setForm({...form, monthly_sip: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#00BAF2] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0098C5] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Investment"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
