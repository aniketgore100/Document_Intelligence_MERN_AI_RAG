import { motion } from "framer-motion";
import { CheckCircle2, Cpu, Database, FileBarChart2, Sparkles, Zap } from "lucide-react";

const cards = [
  { title: "Active Workspaces", value: "12", delta: "+18%", icon: Database },
  { title: "AI Queries", value: "8.4k", delta: "+9%", icon: Cpu },
  { title: "Processed Docs", value: "24.9k", delta: "+23%", icon: FileBarChart2 },
  { title: "Automation Runs", value: "1.2k", delta: "+6%", icon: Zap },
];

const features = [
  "Permission-aware collaboration across teams",
  "AI-assisted extraction with confidence scoring",
  "Unified role and organization governance",
  "Real-time activity monitoring and audit trail",
];

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const Documents = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] muted">Overview</p>
            <h1 className="mt-2 title-xl">AI Document Operations Console</h1>
            <p className="mt-2 max-w-2xl text-sm muted">
              Build and manage secure, intelligent document workflows with a calm, enterprise-grade workspace.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            <Sparkles size={16} />
            Run AI Workflow
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              variants={item}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className="surface rounded-3xl p-5"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <Icon size={18} />
              </div>
              <p className="text-sm muted">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{card.delta} this month</p>
            </motion.article>
          );
        })}
      </section>

      <section className="surface rounded-3xl p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="title-lg">Platform Overview</h2>
            <p className="mt-1 text-sm muted">Everything important in one compact workspace.</p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Live
          </span>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border bg-white/60 p-4 dark:bg-slate-900/45">
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white/60 p-4 dark:bg-slate-900/45">
            <h3 className="text-sm font-medium">Usage Trend</h3>
            <p className="mt-1 text-sm muted">Document analysis activity by week</p>
            <div className="mt-4 h-40 rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-4 dark:from-slate-900 dark:to-slate-800">
              <div className="flex h-full items-end gap-2">
                {[36, 54, 42, 68, 72, 61, 84].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t-xl bg-blue-500/80" style={{ height: `${v}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Documents;
