"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Mic,
  BookOpen,
  FileText,
  TrendingUp,
  Award,
  MessageCircle,
  Landmark,
  ArrowRight,
  Play,
  ChevronDown,
  Zap,
  Shield,
  Clock,
  Users,
  IndianRupee,
  Globe,
  Phone,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

/* ─── FEATURE DATA ─── */
const HERO_STATS = [
  { value: "90%", label: "Identify Savings" },
  { value: "< 670ms", label: "AI Response" },
  { value: "Rs 40K", label: "Saved / Year" },
  { value: "4+", label: "Impact Models" },
];

const QUICK_FEATURES = [
  { icon: Mic, label: "Voice Input", sublabel: "Speech + Text" },
  { icon: BookOpen, label: "Debt Tracker", sublabel: "Credit Cards & Loans" },
  { icon: TrendingUp, label: "Spending Intelligence", sublabel: "Find Patterns" },
  { icon: Award, label: "Health Score", sublabel: "Overall Financial Health" },
];

interface Feature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  titleHi: string;
  subtitle: string;
  points: string[];
  color: string;
  gradient: string;
  screenshot: string;
  screenshotAlt: string;
}

const FEATURES: Feature[] = [
  {
    id: "dashboard",
    icon: TrendingUp,
    title: "Consolidated Financial Health",
    titleHi: "Your complete financial position in one place",
    subtitle: "Connect all your transactions, expenses, debt, and savings to see a complete picture of your financial health.",
    points: [
      "Track Income, Expenses, and Savings",
      "Manage all debt (Loans, Credit Cards)",
      "Spot upcoming cash-flow gaps",
      "AI categorizes everything automatically",
    ],
    color: "text-blue-500",
    gradient: "from-blue-500/10 to-cyan-500/10",
    screenshot: "/screenshots/dashboard.png",
    screenshotAlt: "Financial Health Dashboard with spending and savings patterns",
  },
  {
    id: "copilot",
    icon: MessageCircle,
    title: "AI Financial Copilot",
    titleHi: "Your own Financial Advisor",
    subtitle: "Ask questions naturally. The AI analyzes your data to give personalized, quantified recommendations.",
    points: [
      "Ask 'What happens if I take a 50k loan?'",
      "Strict separation of Fact, Prediction & Recommendation",
      "Quantified expected impact for every action",
      "Works in Voice or Text",
    ],
    color: "text-emerald-500",
    gradient: "from-emerald-500/10 to-green-500/10",
    screenshot: "/screenshots/chat.png",
    screenshotAlt: "AI Chat showing expected impact of saving strategies",
  },
  {
    id: "intelligence",
    icon: Zap,
    title: "Spending & Savings Intelligence",
    titleHi: "Complete understanding of expenses and savings",
    subtitle: "Detects category-wise spending patterns, unusual spending, and consistency of savings contributions.",
    points: [
      "Detect recurring financial obligations",
      "Identify increasing spending trends",
      "Analyze savings rate consistency",
      "Affordability risk detection",
    ],
    color: "text-orange-500",
    gradient: "from-orange-500/10 to-amber-500/10",
    screenshot: "/screenshots/forecast.png",
    screenshotAlt: "Spending intelligence showing unusual spending trends",
  },
  {
    id: "simulator",
    icon: FileText,
    title: "What-If Impact Simulator",
    titleHi: "See the impact before deciding",
    subtitle: "Dynamically see how different actions affect your financial health, cash flow, savings, and debt.",
    points: [
      "Simulate taking new loans",
      "Simulate increasing monthly SIPs",
      "See exact quantified before/after impacts",
      "Test affordability instantly",
    ],
    color: "text-violet-500",
    gradient: "from-violet-500/10 to-purple-500/10",
    screenshot: "/screenshots/impact.png",
    screenshotAlt: "What-If simulator showing cash flow impact",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Mic,
    title: "Speak or Chat",
    titleHi: "Speak or Chat",
    desc: "Talk naturally. Say something like \"Spent 500 rupees on Swiggy\"",
  },
  {
    step: "2",
    icon: Zap,
    title: "AI Processes",
    titleHi: "AI Understands",
    desc: "Whisper transcribes, Groq LLM categorizes expense, amount, and intent in < 670ms",
  },
  {
    step: "3",
    icon: CheckCircle2,
    title: "Dashboard Updates",
    titleHi: "Dashboard Updated",
    desc: "Transaction logged, savings rate updated, debt tracked, and impact analyzed — instantly",
  },
];

/* ─── ANIMATED SECTION WRAPPER ─── */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── FEATURE CARD ─── */
function FeatureSection({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-12 md:py-16"
    >
      <div
        className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-16 items-center`}
      >
        {/* Screenshot side */}
        <div className="flex-1 w-full">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <img
              src={feature.screenshot}
              alt={feature.screenshotAlt}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Text side */}
        <div className="flex-1 w-full">
          <span
            className={`inline-block text-xs font-bold uppercase tracking-widest ${feature.color} mb-3`}
          >
            Feature {index + 1}
          </span>
          <h3 className="text-3xl md:text-4xl font-bold text-[#002E6E] mb-2">
            {feature.title}
          </h3>
          <p className="text-lg text-gray-400 mb-2" lang="hi">
            {feature.titleHi}
          </p>
          <p className="text-base text-gray-600 leading-relaxed mb-6">
            {feature.subtitle}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00BAF2] hover:text-[#002E6E] transition-colors"
          >
            Try it now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-munim.png" alt="Paytm Vyapaar" className="h-10 rounded-lg" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-[#002E6E] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-[#002E6E] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-gray-600 hover:text-[#002E6E] transition-colors"
            >
              About
            </a>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#002E6E] to-[#00BAF2] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00BAF2]/20 hover:shadow-xl hover:shadow-[#00BAF2]/30 transition-all active:scale-[0.98]"
          >
            Try Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#002E6E] via-[#003d8f] to-[#00BAF2]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,186,242,0.15),transparent_70%)]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#00BAF2]/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-white/5 blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80">
                Built on Paytm | Powered by AI
              </span>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mb-8"
            >
              <img src="/logo-munim.png" alt="Paytm Vyapaar" className="h-20 mx-auto rounded-xl shadow-lg" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
            >
              Your Personal
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BAF2] to-cyan-300">
                Financial Health
              </span>{" "}
              Copilot
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Manage your personal finances, track debt, and spot cash-flow gaps. Get actionable recommendations with quantified impact. 
              <span className="text-white font-medium">From transactions to action</span>.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link
                href="/login"
                className="group flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#002E6E] shadow-2xl shadow-black/20 hover:shadow-3xl hover:scale-[1.02] transition-all active:scale-[0.98]"
              >
                <Mic className="h-5 w-5 text-[#00BAF2]" />
                Try Dashboard
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all"
              >
                <Play className="h-4 w-4" />
                Watch Demo
              </a>
            </motion.div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-white/40 mb-12"
            >
              Built to manage your entire financial life
            </motion.p>

            {/* Quick feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-16"
            >
              {QUICK_FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-3"
                >
                  <f.icon className="h-5 w-5 text-[#00BAF2]" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-white/50">{f.sublabel}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-6">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center mt-12"
          >
            <a href="#features" className="text-white/30 hover:text-white/60 transition-colors">
              <ChevronDown className="h-6 w-6 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#00BAF2] mb-3">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-[#002E6E] mb-4">
              Everything your business needs
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Seven AI-powered tools designed specifically for Indian small businesses.
              From voice bookkeeping to government schemes.
            </p>
          </AnimatedSection>

          {/* Feature sections */}
          <div className="divide-y divide-gray-100">
            {FEATURES.map((feature, i) => (
              <FeatureSection key={feature.id} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section
        id="how-it-works"
        className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#00BAF2] mb-3">
              How it Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-[#002E6E] mb-4">
              Three steps. That&apos;s it.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              No training needed. No complex setup. Just speak.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <AnimatedSection key={step.step} delay={i * 0.15}>
                <div className="relative group">
                  <div className="rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002E6E] to-[#00BAF2] shadow-lg shadow-[#00BAF2]/20">
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00BAF2]/10">
                        <span className="text-sm font-bold text-[#00BAF2]">
                          {step.step}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#002E6E] mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3" lang="hi">
                      {step.titleHi}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                  {/* Connector arrow (hidden on last) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ THE PROBLEM / STATS ═══════ */}
      <section className="py-20 md:py-28 bg-[#002E6E] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,186,242,0.15),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#00BAF2] mb-3">
              The Reality
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Stop guessing your financial health
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Most people have bank accounts, credit cards, and loans — but no unified understanding of their overall financial health. The Financial Health Copilot changes that.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                value: "10+",
                label: "Accounts",
                desc: "Fragmented across apps",
              },
              {
                icon: IndianRupee,
                value: "Rs 40K",
                label: "Lost Annually",
                desc: "Due to poor financial planning",
              },
              {
                icon: Shield,
                value: "85%",
                label: "Stressed",
                desc: "About unexpected expenses",
              },
              {
                icon: Globe,
                value: "0",
                label: "Guesses",
                desc: "Data-backed recommendations",
              },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.1}>
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
                  <stat.icon className="h-8 w-8 text-[#00BAF2] mx-auto mb-4" />
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm font-semibold text-white/80 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-white/40">{stat.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section id="about" className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="relative rounded-3xl bg-gradient-to-br from-[#002E6E] to-[#00BAF2] p-12 md:p-20 overflow-hidden">
              {/* Decorative */}
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5" />

              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Ready to transform your financial health?
                </h2>
                <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
                  Join thousands who are already using the Financial Health Copilot
                  to save money, manage debt, and grow their wealth.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#002E6E] shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  <Mic className="h-5 w-5 text-[#00BAF2]" />
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <img src="/logo-munim.png" alt="Paytm Vyapaar" className="h-10 rounded-lg" />
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-gray-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-gray-600 transition-colors">
                How it Works
              </a>
              <Link href="/login" className="hover:text-gray-600 transition-colors">
                Dashboard
              </Link>
            </div>
            <p className="text-xs text-gray-400">
              &copy; 2026 Financial Health Copilot. Made with love in India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
