import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api/authApi";

export default function LoginForm() {
  const navigate = useNavigate();  
  const [email, setEmail] = useState(
  import.meta.env.MODE === 'test' ? '' : 'admin@safetrack.com'
  );   
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
          <label 
            htmlFor="email"
            className="text-base font-medium text-light-text dark:text-dark-text"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-twitterBlue-default focus:ring-2 focus:ring-twitterBlue-default/40 bg-light-content dark:bg-dark-content text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label 
            htmlFor="password"
            className="text-base font-medium text-light-text dark:text-dark-text"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-twitterBlue-default focus:ring-2 focus:ring-twitterBlue-default/40 bg-light-content dark:bg-dark-content text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-[11px] text-light-footerText dark:text-dark-footerText hover:text-light-text dark:hover:text-dark-text"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 bg-twitterBlue-default hover:bg-twitterBlue-hover"
      >
        <span>{loading ? "Authenticating..." : "Sign in"}</span>
      </button>

      <p className="text-center text-[11px] text-light-footerText dark:text-dark-footerText">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-twitterBlue-default hover:text-twitterBlue-hover"
        >
          Register
        </a>
      </p>
    </form>
  );
}