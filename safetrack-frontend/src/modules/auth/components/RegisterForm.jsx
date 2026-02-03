import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest, loginRequest } from "../api/authApi";




const ROLES = ["citizen", "volunteer", "ngo", "admin", "official"];

export default function RegisterForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("citizen");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerRequest({
        email,
        full_name: fullName,
        role,
        password,
      });

      const token = await loginRequest({ email, password });
      localStorage.setItem("access_token", token.access_token);
      navigate("/app/home");

    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Create a SafeTrack account
        </h2>
        <p className="text-xs text-slate-300">
          Register as citizen, volunteer, or NGO member.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-base font-medium text-slate-200">
            Full name
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
          <label className="text-base font-medium text-slate-200">Role</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-base font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-base font-medium text-slate-200">
              Confirm
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{loading ? "Creating account..." : "Create account"}</span>
      </button>

      <p className="text-center text-[11px] text-slate-400">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-cyan-300 hover:text-cyan-200"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
