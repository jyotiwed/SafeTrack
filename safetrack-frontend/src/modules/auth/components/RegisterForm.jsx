// src/modules/auth/components/RegisterForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest, loginRequest } from "../api/authApi";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const ROLES = ["citizen", "volunteer", "ngo", "admin", "official"];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

function validateName(name) {
  if (!name.trim()) return "Full name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) return "Name contains invalid characters";
  return null;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("citizen");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function validateField(field, value) {
    switch (field) {
      case "fullName":
        return validateName(value);
      case "email":
        return validateEmail(value) ? null : "Please enter a valid email address";
      case "password":
        return validatePassword(value);
      case "confirm":
        return value !== password ? "Passwords do not match" : null;
      default:
        return null;
    }
  }

  function handleFieldBlur(field, value) {
    const err = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email) ? null : "Please enter a valid email address";
    const passErr = validatePassword(password);
    const confirmErr = password !== confirm ? "Passwords do not match" : null;

    const newErrors = {};
    if (nameErr) newErrors.fullName = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    if (confirmErr) newErrors.confirm = confirmErr;

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError("Please fix the errors above");
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

      await loginRequest({ email, password });
      
      setSuccess({
        message: "Registration successful!",
        email: email,
        role: role,
        timestamp: new Date().toLocaleString(),
      });

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      const detail = err?.response?.data?.detail;
      let errorMsg = "Registration failed";
      
      if (typeof detail === "string") {
        if (detail.toLowerCase().includes("email") || detail.toLowerCase().includes("already")) {
          errorMsg = "This email is already registered. Please use a different email or sign in.";
        } else if (detail.toLowerCase().includes("password")) {
          errorMsg = "Password does not meet security requirements";
        } else if (detail.toLowerCase().includes("role")) {
          errorMsg = "Invalid role selected. Please choose a valid role";
        } else {
          errorMsg = detail;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 bg-clip-text text-transparent">
          Create SafeTrack Account
        </h2>
        <p className="text-sm text-light-footerText dark:text-dark-footerText">
          Join as citizen, volunteer, or NGO member
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 dark:bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 dark:bg-emerald-500/20 px-5 py-5 text-sm text-emerald-100 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
            <span className="font-semibold text-lg">{success.message}</span>
          </div>
          
          <div className="space-y-2 text-emerald-200/90 bg-emerald-900/20 rounded-xl p-4">
            <p>Account created for: <strong className="text-emerald-100">{success.email}</strong></p>
            <p>Role: <strong>{success.role.charAt(0).toUpperCase() + success.role.slice(1)}</strong></p>
            <p className="text-xs opacity-75">Registered at: {success.timestamp}</p>
          </div>

          <p className="text-xs text-emerald-300/80 pt-2">
            Redirecting to login page...
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-semibold text-light-text dark:text-dark-text">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-light-text dark:text-dark-text placeholder-light-footerText dark:placeholder-dark-footerText backdrop-blur-sm focus:outline-none focus:ring-2 focus:border-primary-500 transition-all duration-200 ${
              fieldErrors.fullName 
                ? "border-red-400/50 focus:ring-red-500/50 bg-red-500/5" 
                : "border-light-border dark:border-dark-border bg-light-content/50 dark:bg-dark-content/50 focus:ring-primary-500/50"
            }`}
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) handleFieldBlur("fullName", e.target.value);
            }}
            onBlur={(e) => handleFieldBlur("fullName", e.target.value)}
          />
          {fieldErrors.fullName && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-light-text dark:text-dark-text">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-light-text dark:text-dark-text placeholder-light-footerText dark:placeholder-dark-footerText backdrop-blur-sm focus:outline-none focus:ring-2 focus:border-primary-500 transition-all duration-200 ${
              fieldErrors.email 
                ? "border-red-400/50 focus:ring-red-500/50 bg-red-500/5" 
                : "border-light-border dark:border-dark-border bg-light-content/50 dark:bg-dark-content/50 focus:ring-primary-500/50"
            }`}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) handleFieldBlur("email", e.target.value);
            }}
            onBlur={(e) => handleFieldBlur("email", e.target.value)}
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-semibold text-light-text dark:text-dark-text">
            Role
          </label>
          <select
            id="role"
            name="role"
            className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-content/70 dark:bg-dark-content/70 px-4 py-3 text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 backdrop-blur-sm cursor-pointer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-light-content dark:bg-dark-content">
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-light-text dark:text-dark-text">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-light-text dark:text-dark-text placeholder-light-footerText dark:placeholder-dark-footerText backdrop-blur-sm focus:outline-none focus:ring-2 focus:border-accent-500 transition-all duration-200 ${
                fieldErrors.password 
                  ? "border-red-400/50 focus:ring-red-500/50 bg-red-500/5" 
                  : "border-light-border dark:border-dark-border bg-light-content/50 dark:bg-dark-content/50 focus:ring-accent-500/50"
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) handleFieldBlur("password", e.target.value);
              }}
              onBlur={(e) => handleFieldBlur("password", e.target.value)}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {fieldErrors.password}
              </p>
            )}
            {!fieldErrors.password && password && (
              <ul className="text-[10px] text-light-footerText dark:text-dark-footerText space-y-0.5 mt-2">
                <li className={password.length >= 8 ? "text-emerald-400" : ""}>• 8+ characters</li>
                <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>• One uppercase</li>
                <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>• One number</li>
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-light-text dark:text-dark-text">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-light-text dark:text-dark-text placeholder-light-footerText dark:placeholder-dark-footerText backdrop-blur-sm focus:outline-none focus:ring-2 focus:border-accent-500 transition-all duration-200 ${
                fieldErrors.confirm 
                  ? "border-red-400/50 focus:ring-red-500/50 bg-red-500/5" 
                  : "border-light-border dark:border-dark-border bg-light-content/50 dark:bg-dark-content/50 focus:ring-accent-500/50"
              }`}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (fieldErrors.confirm) handleFieldBlur("confirm", e.target.value);
              }}
              onBlur={(e) => handleFieldBlur("confirm", e.target.value)}
              autoComplete="new-password"
            />
            {fieldErrors.confirm && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {fieldErrors.confirm}
              </p>
            )}
            {confirm && !fieldErrors.confirm && password === confirm && (
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <CheckCircle className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !!success}
        className="group relative w-full rounded-2xl bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 text-white font-semibold px-6 py-4 text-sm shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 focus:outline-none focus:ring-4 focus:ring-primary-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</>
        ) : success ? (
          <><CheckCircle className="h-5 w-5" /> Success! Redirecting...</>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-xs text-light-footerText dark:text-dark-footerText">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-semibold text-primary-400 hover:text-primary-300 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}