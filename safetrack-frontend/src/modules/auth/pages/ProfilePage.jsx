import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile, logoutRequest } from "../api/authApi";
import AuthCard from "../components/AuthCard";
import Logo from "../components/Logo";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const data = await fetchProfile();
        setUser(data);
      } catch {
        setError("Unable to load profile. Please login again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // ignore error; still clear token
    }
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  const initial =
    user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase();

  return (
    <AuthCard>
      <div className="mb-6 flex flex-col items-center gap-4">
        <Logo size="lg" />
        {user && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 text-lg font-semibold text-white shadow-lg shadow-cyan-500/30">
              {initial}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-50">
                {user.full_name || "Unnamed user"}
              </p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-300">
          Loading profile…
        </p>
      ) : error ? (
        <p className="text-center text-sm text-red-400">{error}</p>
      ) : (
        <div className="space-y-5">
          <header className="space-y-1 text-center">
            <h2 className="text-xl font-semibold text-slate-50">
              Account profile
            </h2>
            <p className="text-xs text-slate-400">
              Manage your SafeTrack identity and session.
            </p>
          </header>

          <div className="space-y-3 text-sm">
            <ProfileRow label="Full name">
              {user.full_name || "—"}
            </ProfileRow>

            <ProfileRow label="Role">
              <span className="inline-flex rounded-full bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-cyan-300">
                {user.role}
              </span>
            </ProfileRow>

            <ProfileRow label="Status">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </ProfileRow>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      )}
    </AuthCard>
  );
}

/* ------------- small helper for rows ------------- */

function ProfileRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="text-right text-sm text-slate-50">{children}</div>
    </div>
  );
}
