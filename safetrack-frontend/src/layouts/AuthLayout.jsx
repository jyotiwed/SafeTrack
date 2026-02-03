export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* animated background gradient layer */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-sky-500/5" />

      {/* animated blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-500/40 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-500/40 blur-3xl animate-pulse delay-1000" />

      {/* subtle grid/noise overlay (optional) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12)_0,_transparent_55%)] opacity-40 mix-blend-soft-light" />

      {/* centered auth card */}
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-md">
          {/* glassmorphism card wrapper */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/40 via-indigo-500/40 to-fuchsia-500/40 opacity-60 blur-xl" />
          <div className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
