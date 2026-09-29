"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR, DEMO_MERCHANT_ID, API_BASE_URL } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import {
  Landmark,
  Home,
  Car,
  User,
  Plus,
  X,
  CreditCard,
  AlertTriangle
} from "lucide-react";

interface Loan {
  id: string;
  name: string;
  type: string;
  principal: number;
  outstanding: number;
  emi_amount: number;
  interest_rate: number;
  next_due_date: string;
}

export default function LoansPage() {
  const toast = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "personal",
    principal: "",
    outstanding: "",
    emi_amount: "",
    interest_rate: "",
    next_due_date: "",
  });

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${DEMO_MERCHANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.outstanding) return;
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        principal: parseFloat(form.principal || form.outstanding),
        outstanding: parseFloat(form.outstanding),
        emi_amount: parseFloat(form.emi_amount || "0"),
        interest_rate: parseFloat(form.interest_rate || "0"),
        next_due_date: form.next_due_date
      };

      const res = await fetch(`${API_BASE_URL}/api/loans/${DEMO_MERCHANT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.showToast("Loan added successfully", "success");
        setShowAdd(false);
        fetchLoans();
        setForm({ name: "", type: "personal", principal: "", outstanding: "", emi_amount: "", interest_rate: "", next_due_date: "" });
      }
    } catch {
      toast.showToast("Failed to add loan", "error");
    } finally {
      setSaving(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "home_loan": return <Home className="w-5 h-5 text-indigo-500" />;
      case "car_loan": return <Car className="w-5 h-5 text-blue-500" />;
      case "personal": return <User className="w-5 h-5 text-amber-500" />;
      default: return <Landmark className="w-5 h-5 text-gray-500" />;
    }
  };

  const summary = useMemo(() => {
    let totalOutstanding = 0;
    let totalEMI = 0;
    
    loans.forEach(loan => {
      totalOutstanding += loan.outstanding;
      totalEMI += loan.emi_amount;
    });

    return {
      totalOutstanding,
      totalEMI
    };
  }, [loans]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-[#00BAF2]" />
            Loans & Debt Obligations
          </h1>
          <p className="text-sm text-gray-500">Track your EMIs, outstanding principal, and upcoming dues.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#00BAF2] hover:bg-[#0098C5] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#00BAF2]/20"
        >
          <Plus className="w-4 h-4" />
          Add Loan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Outstanding Debt</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatINR(summary.totalOutstanding)}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Monthly EMI</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(summary.totalEMI)} <span className="text-sm font-normal text-gray-500">/mo</span></p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading loans...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Landmark className="w-12 h-12 mb-3 opacity-20" />
            <p>No active loans found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {loans.map(loan => (
              <div key={loan.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {getIconForType(loan.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{loan.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded">
                        {loan.type.replace('_', ' ')}
                      </span>
                      {loan.interest_rate > 0 && (
                        <span className="text-xs text-gray-500">@ {loan.interest_rate}% p.a.</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-x-8 gap-y-4 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500">EMI Amount</p>
                    <p className="font-medium text-gray-900">{formatINR(loan.emi_amount)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500">Outstanding</p>
                    <p className="font-bold text-red-600">{formatINR(loan.outstanding)}</p>
                  </div>
                  {loan.next_due_date && (
                    <div className="text-left md:text-right min-w-[90px]">
                      <p className="text-xs text-gray-500">Next Due</p>
                      <p className="font-medium text-gray-900">
                        {new Date(loan.next_due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="font-bold text-gray-900">Add Loan/Debt</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <form id="add-loan-form" onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Loan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBI Home Loan"
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Loan Type</label>
                  <select
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                  >
                    <option value="home_loan">Home Loan</option>
                    <option value="car_loan">Car Loan</option>
                    <option value="personal">Personal Loan / Borrowing</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Original Principal</label>
                    <input
                      type="number"
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.principal}
                      onChange={e => setForm({...form, principal: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Outstanding Amount</label>
                    <input
                      type="number"
                      required
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.outstanding}
                      onChange={e => setForm({...form, outstanding: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">EMI Amount</label>
                    <input
                      type="number"
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.emi_amount}
                      onChange={e => setForm({...form, emi_amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border-gray-200 rounded-xl text-sm"
                      value={form.interest_rate}
                      onChange={e => setForm({...form, interest_rate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    className="w-full border-gray-200 rounded-xl text-sm"
                    value={form.next_due_date}
                    onChange={e => setForm({...form, next_due_date: e.target.value})}
                  />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="submit"
                form="add-loan-form"
                disabled={saving}
                className="w-full bg-[#00BAF2] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0098C5] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Loan"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
