// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";



function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Routes>
          {/* Society help landing page */}
          <Route
            path="/"
            element={
              <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-12 md:flex-row md:gap-12">
                  {/* Text side */}
                  <section className="space-y-6 text-center md:flex-1 md:text-left">
                    <p className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                      SafeTrack • Community Safety & Support
                    </p>

                    <h1 className="text-3xl font-semibold leading-tight text-slate-50 md:text-4xl lg:text-5xl">
                      Together we{" "}
                      <span className="text-emerald-300">
                        make societies safer
                      </span>
                      .
                    </h1>

                    <p className="max-w-xl text-sm text-slate-300 md:text-base">
                      SafeTrack is a community-driven platform to report
                      incidents, track hazards, and coordinate quick help for
                      people living in the same society, colony, or village.
                    </p>

                    <ul className="space-y-2 text-sm text-slate-200">
                      <li>• Report safety incidents in just a few taps.</li>
                      <li>• Keep your neighbours informed and protected.</li>
                      <li>• Help authorities and RWAs take faster action.</li>
                    </ul>

                    <div className="flex flex-col items-center gap-3 pt-2 md:flex-row md:items-start">
                      <Link
                        to="/register"
                        className="w-full rounded-md bg-emerald-500 px-5 py-2.5 text-center text-sm font-medium text-slate-950 shadow-md transition hover:bg-emerald-400 md:w-auto"
                      >
                        Get started for free
                      </Link>
                      <Link
                        to="/login"
                        className="w-full text-center text-sm font-medium text-emerald-300 underline-offset-4 hover:underline md:w-auto"
                      >
                        Already helping your society? Log in
                      </Link>
                    </div>

                    <p className="pt-2 text-xs text-slate-400">
                      Built for Residents, RWAs, NGOs, and local volunteers who
                      care about safer neighbourhoods.
                    </p>
                  </section>

                  {/* Right side illustration-style block */}
                  <aside className="mt-10 w-full md:mt-0 md:flex-1">
                    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-4 shadow-xl shadow-emerald-500/10">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-200">
                          Live society snapshot
                        </p>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      </div>

                      <div className="grid gap-3 text-xs text-slate-200">
                        <div className="flex items-center justify-between rounded-md bg-slate-800/80 px-3 py-2">
                          <span>Street light not working</span>
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                            Open
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-slate-800/80 px-3 py-2">
                          <span>Water leakage in Block B</span>
                          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
                            In progress
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-slate-800/80 px-3 py-2">
                          <span>Stray dog rescue request</span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                            Resolved
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 text-[11px] text-slate-400">
                        This is a sample preview. Log in to view and manage
                        real incidents in your society.
                      </p>
                    </div>
                  </aside>
                </div>
              </main>
            }
          />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* 404 Not Found */}

          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center">
                <h2 className="text-sm text-slate-200">
                  404 · Page not found.{" "}
                  <Link to="/" className="text-emerald-300 underline">
                    Go home
                  </Link>
                </h2>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
