export default function AuthCard({ children }) {
  return (
    <div className="group relative rounded-3xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1 hover:border-primary-500/60">
      {/* top accent line */}
      <div className="pointer-events-none absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-primary-500 via-emerald-400 to-accent-500 opacity-80" />
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/0 to-white/5 opacity-60 group-hover:opacity-80 transition-opacity" />
      <div className="relative">{children}</div>
    </div>
  );
}
