"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR, DEMO_MERCHANT_ID, API_BASE_URL } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import {
  Wallet,
  CreditCard,
  Building,
  Landmark,
  Plus,
  X,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  credit_limit?: number;
  apr?: number;
}

export default function AccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "bank_account",
    balance: "",
    credit_limit: "",
    apr: "",
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/${DEMO_MERCHANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.balance) return;
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance),
        credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : 0,
        apr: form.apr ? parseFloat(form.apr) : 0
      };

      const res = await fetch(`${API_BASE_URL}/api/accounts/${DEMO_MERCHANT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.showToast("Account added successfully", "success");
        setShowAdd(false);
        fetchAccounts();
        setForm({ name: "", type: "bank_account", balance: "", credit_limit: "", apr: "" });
      }
    } catch {
      toast.showToast("Failed to add account", "error");
    } finally {
      setSaving(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "bank_account": return <Building className="w-5 h-5 text-emerald-500" />;
      case "credit_card": return <CreditCard className="w-5 h-5 text-red-500" />;
      case "loan": return <Landmark className="w-5 h-5 text-amber-500" />;
      case "investment": return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default: return <Wallet className="w-5 h-5 text-gray-500" />;
    }
  };

  const summary = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    accounts.forEach(a => {
      if (a.balance > 0 && a.type !== 'credit_card' && a.type !== 'loan') {
        totalAssets += a.balance;
      } else if (a.balance < 0) {
        totalLiabilities += Math.abs(a.balance);
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  }, [accounts]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-[#00BAF2]" />
            Accounts & Cards
          </h1>
          <p className="text-sm text-gray-500">Track all your bank balances, credit cards, and investments.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#00BAF2] hover:bg-[#0098C5] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#00BAF2]/20"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Net Worth</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(summary.netWorth)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Assets</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(summary.totalAssets)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Debt (Liabilities)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatINR(summary.totalLiabilities)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Wallet className="w-12 h-12 mb-3 opacity-20" />
            <p>No accounts added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {getIconForType(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{acc.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${acc.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatINR(acc.balance)}
                  </p>
                  {acc.type === 'credit_card' && acc.credit_limit && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Limit: {formatINR(acc.credit_limit)}
                    </p>
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">Add Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary Account"
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border-gray-200 rounded-xl text-sm"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="bank_account">Bank Account</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="loan">Loan</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Current Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-8 border-gray-200 rounded-xl text-sm"
                    value={form.balance}
                    onChange={e => setForm({...form, balance: e.target.value})}
                  />
                </div>
              </div>

              {form.type === 'credit_card' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Credit Limit</label>
                    <input
                      type="number"
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.credit_limit}
                      onChange={e => setForm({...form, credit_limit: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">APR (%)</label>
                    <input
                      type="number"
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.apr}
                      onChange={e => setForm({...form, apr: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#00BAF2] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0098C5] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
