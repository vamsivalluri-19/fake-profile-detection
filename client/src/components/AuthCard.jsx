import GlassCard from './GlassCard';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <GlassCard className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-300/80">Fake Profile Detection System</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-6 border-t border-white/10 pt-6">{footer}</div> : null}
      </GlassCard>
    </div>
  );
}
