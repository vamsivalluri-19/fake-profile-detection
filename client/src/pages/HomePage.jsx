import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Radar, ShieldCheck, Sparkles, Zap, CirclePlay } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import SectionTitle from '../components/SectionTitle';

const features = [
  {
    icon: BrainCircuit,
    title: 'Multi-model AI scoring',
    description: 'Logistic Regression, Random Forest, and Decision Tree work together to determine profile risk with a confidence score.',
  },
  {
    icon: Radar,
    title: 'Behavior pattern analysis',
    description: 'We inspect follower ratios, account age, username patterns, engagement, and completeness signals.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure reporting',
    description: 'JWT-protected scans are stored in MongoDB so you can review analysis history and recent activity.',
  },
  {
    icon: Zap,
    title: 'Quick profile presets',
    description: 'Load a fake or real sample instantly to test the model and demonstrate how the profile preview behaves.',
  },
  {
    icon: CirclePlay,
    title: 'CSV export and search',
    description: 'Search report history by username or risk level, then export it as a CSV file for sharing.',
  },
  {
    icon: Sparkles,
    title: 'Flexible mobile layout',
    description: 'The UI adapts smoothly across phones, tablets, and laptops with responsive cards and charts.',
  },
];

const stats = [
  { value: '99.2%', label: 'Detection confidence' },
  { value: '3', label: 'ML models combined' },
  { value: '< 1s', label: 'Average scan response' },
  { value: '24/7', label: 'Monitoring readiness' },
];

const testimonials = [
  { name: 'Ava Chen', role: 'Trust & Safety Lead', quote: 'The UI feels like a premium AI product and the scoring explanations are clear enough for operations teams.' },
  { name: 'Marcus Hill', role: 'SOC Analyst', quote: 'The risk breakdown is fast, intuitive, and practical for triage work.' },
  { name: 'Nina Patel', role: 'Product Manager', quote: 'The dashboard gives a polished at-a-glance view of fake profile activity across scans.' },
];

function FloatingOrb({ className }) {
  return <motion.div animate={{ y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className={className} />;
}

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
        <FloatingOrb className="absolute left-[-30px] top-20 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <FloatingOrb className="absolute right-0 top-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative z-10">
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
              <Sparkles size={14} /> AI-powered fake profile intelligence
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
              Detect fake social profiles with a futuristic AI security cockpit.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Analyze usernames, engagement, account age, profile completeness, and activity signals to predict whether a profile is Real or Fake.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:scale-[1.02]">
                Start scanning now <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <CirclePlay size={16} /> View dashboard demo
              </Link>
            </motion.div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {['Realtime fraud risk', 'Animated insights', 'Mobile responsive'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">{item}</div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
            <GlassCard className="relative overflow-hidden p-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_38%)]" />
              <div className="relative space-y-4 p-6 sm:p-8">
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">AI Profile Scan</div>
                    <div className="mt-1 text-2xl font-semibold text-white">Risk Engine</div>
                  </div>
                  <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">Live</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Prediction</p>
                    <p className="mt-3 text-4xl font-semibold text-white">Fake</p>
                    <p className="mt-2 text-sm text-slate-300">Confidence: 92%</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Risk meter</p>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" />
                    </div>
                    <p className="mt-3 text-sm text-slate-300">High risk account pattern detected.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200"><Zap size={16} /> Reasons</div>
                  <div className="grid gap-2 text-sm text-slate-300">
                    <span>Suspicious username pattern</span>
                    <span>Low followers-to-following ratio</span>
                    <span>Very new account age</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <GlassCard key={item.label} className="text-center">
              <div className="text-4xl font-semibold text-white">{item.value}</div>
              <div className="mt-2 text-sm text-slate-400">{item.label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionTitle eyebrow="Core strengths" title="Built for fraud triage teams" description="Everything is structured to feel like a premium AI startup product while staying practical for real profile analysis workflows." />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <GlassCard className="h-full">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{feature.description}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <GlassCard className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionTitle eyebrow="Why it works" title="A detection flow that surfaces risk fast" description="The form, model response, and report history are designed to give analysts immediate, explainable results." />
            <div className="mt-8 space-y-4 text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">1. Submit profile signals from social media.</div>
              <div className="rounded-2xl bg-white/5 p-4">2. Backend forwards them to the Python AI service.</div>
              <div className="rounded-2xl bg-white/5 p-4">3. Result card shows prediction, confidence, risk, and reasons.</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {testimonials.map((item, index) => (
              <motion.div key={item.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <div className="h-full rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm leading-7 text-slate-300">&quot;{item.quote}&quot;</p>
                  <div className="mt-5">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{item.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Fake Profile Detection System</p>
          <div className="flex items-center gap-6">
            <Link to="/register" className="transition hover:text-cyan-300">Get started</Link>
            <Link to="/login" className="transition hover:text-cyan-300">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
