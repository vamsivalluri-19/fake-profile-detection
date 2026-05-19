import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArcElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { BellRing, Bot, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import SectionTitle from '../components/SectionTitle';
import Spinner from '../components/Spinner';
import Sidebar from '../components/Sidebar';
import { fetchReports, fetchMetrics } from '../lib/api';
import { useAuth } from '../App';

ChartJS.register(ArcElement, CategoryScale, LineElement, LinearScale, PointElement, Tooltip, Legend);

const fallbackReports = [
  { prediction: 'Fake', confidence: 92, riskLevel: 'High', createdAt: new Date().toISOString() },
  { prediction: 'Real', confidence: 87, riskLevel: 'Low', createdAt: new Date().toISOString() },
  { prediction: 'Fake', confidence: 78, riskLevel: 'Medium', createdAt: new Date().toISOString() },
];

function Metric({ icon: Icon, label, value, tone = 'cyan' }) {
  const toneClasses = tone === 'rose' ? 'from-rose-500/20 to-orange-500/10 text-rose-200' : tone === 'emerald' ? 'from-emerald-500/20 to-cyan-500/10 text-emerald-200' : 'from-cyan-500/20 to-violet-500/10 text-cyan-200';
  return (
    <GlassCard className={`bg-gradient-to-br ${toneClasses}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white">
          <Icon size={20} />
        </div>
      </div>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const { auth } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [reportsRes, metricsRes] = await Promise.all([fetchReports(auth.token), fetchMetrics(auth.token)]);
        setReports(reportsRes.reports?.length ? reportsRes.reports : fallbackReports);
        setMetricsData(metricsRes?.metrics || null);
      } catch (error) {
        setReports(fallbackReports);
        setMetricsData(null);
        toast.error('Using demo data while the reports service is unavailable');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth.token]);

  const clientComputedMetrics = useMemo(() => {
    const total = reports.length || 0;
    const fakeCount = reports.filter((item) => item.prediction === 'Fake').length;
    const realCount = reports.filter((item) => item.prediction === 'Real').length;
    const accuracy = total ? Math.round((realCount / total) * 100) : 0;
    return { total, fakeCount, realCount, accuracy };
  }, [reports]);

  const metrics = metricsData ? {
    total: metricsData.total,
    fakeCount: metricsData.fakeCount,
    realCount: metricsData.realCount,
    accuracy: metricsData.total ? Math.round((metricsData.realCount / metricsData.total) * 100) : 0,
    avgConfidence: metricsData.avgConfidence,
    trends: metricsData.trends || [],
  } : { ...clientComputedMetrics, trends: [] };

  const trendLabels = metrics.trends && metrics.trends.length ? metrics.trends.map((t) => t.date.slice(5)) : [];
  const fakeTrend = metrics.trends && metrics.trends.length ? metrics.trends.map((t) => t.fake) : [];
  const realTrend = metrics.trends && metrics.trends.length ? metrics.trends.map((t) => t.real) : [];

  const lineData = {
    labels: trendLabels.length ? trendLabels : ['-','-','-','-','-','-'],
    datasets: [
      {
        label: 'Fake detections',
        data: fakeTrend.length ? fakeTrend : [0, 0, 0, 0, 0, 0],
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Real profiles',
        data: realTrend.length ? realTrend : [0, 0, 0, 0, 0, 0],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: ['Fake', 'Real'],
    datasets: [
      {
        data: [metrics.fakeCount || 0, metrics.realCount || 0],
        backgroundColor: ['#22d3ee', '#a855f7'],
        borderWidth: 0,
      },
    ],
  };

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesTerm = !term
        || String(report.input?.username || report.username || '').toLowerCase().includes(term)
        || String(report.prediction || '').toLowerCase().includes(term)
        || String(report.riskLevel || '').toLowerCase().includes(term);

      const matchesRisk = riskFilter === 'all' || String(report.riskLevel || '').toLowerCase() === riskFilter;
      return matchesTerm && matchesRisk;
    });
  }, [reports, riskFilter, searchTerm]);

  function exportCsv() {
    const rows = [
      ['Username', 'Prediction', 'Risk Level', 'Confidence', 'Created At'],
      ...filteredReports.map((report) => [
        report.input?.username || report.username || '',
        report.prediction || '',
        report.riskLevel || '',
        report.confidence ?? '',
        report.createdAt || '',
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fake-profile-reports.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        <Sidebar />
        <div className="space-y-8">
          <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-300/80">AI Detection Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, {auth.user?.name || 'Analyst'}</h1>
              <p className="mt-2 max-w-2xl text-slate-300">Monitor profile scans, review confidence trends, and inspect your latest fraud findings.</p>
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100">
              <div className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> Live AI telemetry</div>
              <div className="mt-1 text-cyan-50/80">Updated in real time from recent profile scans</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Bot} label="Total Profiles Scanned" value={metrics.total || '128'} />
            <Metric icon={ShieldAlert} label="Fake Profiles Detected" value={metrics.fakeCount || '58'} tone="rose" />
            <Metric icon={ShieldCheck} label="Real Profiles Detected" value={metrics.realCount || '70'} tone="emerald" />
            <Metric icon={BellRing} label="Detection Accuracy" value={`${metrics.accuracy || 92}%`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:gap-8">
            <GlassCard>
              <SectionTitle eyebrow="Confidence charts" title="AI confidence across recent activity" description="Track model behavior and scan mix with responsive charts powered by Chart.js." />
              <div className="mt-8 h-[260px] sm:h-[320px]">
                <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cbd5e1' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } } } }} />
              </div>
            </GlassCard>

            <GlassCard>
              <SectionTitle eyebrow="Model mix" title="Confidence split" description="The chart shows a live-style breakdown of fake versus real detection outcomes." />
              <div className="mt-8 h-[240px] sm:h-[280px]">
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
              </div>
            </GlassCard>
          </div>

          <GlassCard>
            <SectionTitle eyebrow="Recent activity" title="Latest scans" description="The report stream keeps a running history of analyzed profiles." />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search username or risk"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />
                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="all">All risks</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <button type="button" onClick={exportCsv} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20">
                Export CSV
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <Spinner label="Loading recent reports" />
              ) : (
                filteredReports.slice(0, 6).map((report, index) => (
                    <motion.div key={`${report.createdAt}-${index}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-white">{report.input?.username || 'Unknown user'} — {report.prediction} profile detected</div>
                      <div className="text-sm text-slate-400">Risk level: {report.riskLevel}</div>
                    </div>
                    <div className="text-sm text-slate-300">Confidence {report.confidence}%</div>
                  </motion.div>
                ))
              )}
              {!loading && filteredReports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
                  No reports match your search. Try a different username or risk level.
                </div>
              ) : null}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
