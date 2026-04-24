// src/modules/Notifications/NotificationsBell.jsx
import { useNavigate } from "react-router-dom";
import { useNotifications } from "./NotificationsContext";
import { Bell } from "lucide-react";

export default function NotificationsBell() {
  const { unreadCount, connected } = useNotifications();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/app/notifications")}
      title="Notifications"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-cyan-400 transition-colors"
    >
      <Bell size={18} />

      {/* unread count badge — only when there are unreads */}
      {unreadCount > 0 && (
        <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full border-2 border-[#09090b] bg-red-500 px-1 font-mono text-[10px] font-bold leading-[14px] text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {/* live / offline dot */}
      <span
        className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#09090b]"
        style={{ background: connected ? "#4ade80" : "rgba(228,228,231,0.2)" }}
        title={connected ? "Live" : "Offline"}
      />
    </button>
  );
}