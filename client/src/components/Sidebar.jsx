import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Search, Home, ShieldCheck } from 'lucide-react';

const items = [
  { label: 'Overview', to: '/dashboard', icon: Home },
  { label: 'Scan Profile', to: '/detect', icon: Search },
  { label: 'Reports', to: '/dashboard?view=reports', icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="glass-panel neon-border sticky top-24 hidden h-fit w-72 rounded-[28px] p-4 lg:block">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white/5 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">AI Control Center</div>
          <div className="text-xs text-slate-400">Monitoring and analysis hub</div>
        </div>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-4 text-sm text-slate-300">
        Live AI scoring, risk explanations, and historical activity are available once you run a profile scan.
      </div>
    </aside>
  );
}
