import Logo from "../../auth/components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <Logo size="md" />
          <nav className="flex items-center gap-4 text-xs">
            <a href="#features" className="text-slate-300 hover:text-white">
              Features
            </a>
            <a href="#tech" className="text-slate-300 hover:text-white">
              Tech
            </a>
            <a href="#cta" className="text-slate-300 hover:text-white">
              Get started
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium hover:bg-white/10"
            >
              Sign in
            </a>
          </nav>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-start justify-center gap-8 py-8">
          <section className="max-w-xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              SafeTrack API · v0.1.0 · FastAPI + PostGIS
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Real‑time incident,{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                risk
              </span>{" "}
              &amp; emergency intelligence.
            </h1>

            <p className="text-sm leading-relaxed text-slate-300">
              SafeTrack unifies incident reporting, task management, geospatial
              maps, ML‑based risk prediction, preparedness guidelines, and SOS
              triggers into one structured platform.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110"
              >
                Get started free
              </a>
              <a
                href="http://127.0.0.1:8000/docs"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-white/10"
              >
                View API docs
              </a>
            </div>
          </section>

          {/* Simple feature bullets */}
          <section
            id="features"
            className="max-w-xl space-y-2 text-xs text-slate-300"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              FEATURES
            </p>
            <ul className="space-y-1">
              <li>• Role‑based auth for citizens, responders, NGOs, and officials.</li>
              <li>• Incident lifecycle with severity, status, and nearby search.</li>
              <li>• Tasks, analytics, and geospatial visualizations for operations.</li>
            </ul>
          </section>
        </main>

        {/* Footer / CTA */}
        <section
          id="cta"
          className="border-t border-white/10 py-4 text-[11px] text-slate-400"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>SafeTrack · v0.1.0</p>
            <p>Sign up to explore incidents, tasks, analytics, and SOS tools.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
