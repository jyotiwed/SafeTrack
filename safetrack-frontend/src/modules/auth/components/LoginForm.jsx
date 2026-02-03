import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api/authApi";

export default function LoginForm() {
  
  const navigate = useNavigate();  
  const [email, setEmail] = useState("admin@safetrack.com");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await loginRequest({ email, password });
      localStorage.setItem("access_token", token.access_token);
      navigate("/app/home");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Sign in to SafeTrack
        </h2>
         
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-base font-medium text-slate-200">Email</label>
          <input
            type="email"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-base font-medium text-slate-200">
            Password
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-[11px] text-slate-300 hover:text-white"
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{loading ? "Authenticating..." : "Sign in"}</span>
      </button>

      <p className="text-center text-[11px] text-slate-400">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-cyan-300 hover:text-cyan-200"
        >
          Register
        </a>
      </p>
    </form>
  );
}
