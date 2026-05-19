export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`glass-panel neon-border rounded-[24px] p-4 shadow-2xl shadow-cyan-950/20 sm:rounded-[28px] sm:p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  );
}
