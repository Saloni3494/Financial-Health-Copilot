"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR, DEMO_MERCHANT_ID, API_BASE_URL } from "@/lib/constants";
import {
  Calculator,
  ShoppingBag,
  CreditCard,
  Banknote,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface AffordabilityResult {
  item_name: string;
  cost: number;
  can_afford: boolean;
  status_color: "green" | "yellow" | "red";
  analysis: string[];
  metrics: {
    liquid_cash_before: number;
    liquid_cash_after: number;
    surplus_before: number;
    surplus_after: number;
  };
}

export default function AffordabilityPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AffordabilityResult | null>(null);
  
  const [form, setForm] = useState({
    item_name: "",
    cost: "",
    payment_mode: "upfront",
    emi_months: "12"
  });

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_name || !form.cost) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/affordability/${DEMO_MERCHANT_ID}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: form.item_name,
          cost: parseFloat(form.cost),
          payment_mode: form.payment_mode,
          emi_months: parseInt(form.emi_months)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (color: string) => {
    switch(color) {
      case "green": return <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />;
      case "red": return <XCircle className="w-16 h-16 text-red-500 mb-4" />;
      case "yellow": return <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-[#00BAF2]" />
            Affordability Checks
          </h1>
          <p className="text-sm text-gray-500">Ask the Copilot: "Can I afford this?" before making a big purchase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <form onSubmit={handleCheck} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#00BAF2]" />
                What do you want to buy?
              </label>
              <input
                type="text"
                required
                placeholder="e.g. iPhone 16 Pro, New Car, Vacations"
                className="w-full border-gray-200 rounded-xl text-base p-3 focus:ring-2 focus:ring-[#00BAF2] focus:border-transparent transition-all"
                value={form.item_name}
                onChange={e => setForm({...form, item_name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-500" />
                Estimated Cost
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  required
                  className="w-full pl-9 border-gray-200 rounded-xl text-base p-3 focus:ring-2 focus:ring-[#00BAF2]"
                  value={form.cost}
                  onChange={e => setForm({...form, cost: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-500" />
                How will you pay?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({...form, payment_mode: "upfront"})}
                  className={`p-3 rounded-xl border font-medium text-sm transition-all ${
                    form.payment_mode === "upfront" 
                      ? "border-[#00BAF2] bg-[#00BAF2]/10 text-[#00BAF2]" 
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Pay Upfront (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, payment_mode: "emi"})}
                  className={`p-3 rounded-xl border font-medium text-sm transition-all ${
                    form.payment_mode === "emi" 
                      ? "border-[#00BAF2] bg-[#00BAF2]/10 text-[#00BAF2]" 
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Finance (EMI)
                </button>
              </div>
            </div>

            <AnimatePresence>
              {form.payment_mode === "emi" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    EMI Tenure (Months)
                  </label>
                  <select
                    className="w-full border-gray-200 rounded-xl text-base p-3 focus:ring-2 focus:ring-[#00BAF2]"
                    value={form.emi_months}
                    onChange={e => setForm({...form, emi_months: e.target.value})}
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="9">9 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00BAF2] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#0098C5] disabled:opacity-50 transition-colors shadow-lg shadow-[#00BAF2]/30 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? "Analyzing Financials..." : "Check Affordability"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>

        {/* Result Area */}
        <div className="h-full">
          {loading ? (
            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-12 min-h-[400px]">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#00BAF2] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Crunching your numbers...</p>
            </div>
          ) : !result ? (
            <div className="h-full bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[400px]">
              <Calculator className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-700">Ready to check</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-[250px]">
                Enter a purchase amount and let FinSight AI determine if it aligns with your financial health.
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`h-full bg-white rounded-2xl border-2 shadow-lg overflow-hidden flex flex-col min-h-[400px] ${
                result.status_color === 'green' ? 'border-emerald-500' :
                result.status_color === 'red' ? 'border-red-500' : 'border-amber-500'
              }`}
            >
              <div className={`p-8 flex flex-col items-center text-center text-white ${
                result.status_color === 'green' ? 'bg-emerald-500' :
                result.status_color === 'red' ? 'bg-red-500' : 'bg-amber-500'
              }`}>
                {getStatusIcon(result.status_color)}
                <h2 className="text-2xl font-bold mb-1">
                  {result.can_afford ? "Yes, you can afford this!" : "No, you cannot afford this."}
                </h2>
                <p className="text-white/80 font-medium">
                  {result.item_name} • {formatINR(result.cost)}
                </p>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-4 mb-8 flex-1">
                  {result.analysis.map((text, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        result.status_color === 'green' ? 'bg-emerald-500' :
                        result.status_color === 'red' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></div>
                      <p className="text-gray-700 font-medium leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Expected Impact</p>
                  
                  {form.payment_mode === "upfront" ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Liquid Cash</p>
                        <p className="font-bold text-gray-900">{formatINR(result.metrics.liquid_cash_before)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">After Purchase</p>
                        <p className={`font-bold ${result.status_color === 'red' ? 'text-red-500' : 'text-emerald-600'}`}>
                          {formatINR(result.metrics.liquid_cash_after)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Monthly Surplus</p>
                        <p className="font-bold text-gray-900">{formatINR(result.metrics.surplus_before)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">After EMI</p>
                        <p className={`font-bold ${result.status_color === 'red' ? 'text-red-500' : 'text-emerald-600'}`}>
                          {formatINR(result.metrics.surplus_after)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
