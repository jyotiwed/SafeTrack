// src/modules/Notifications/NotificationsContext.jsx
import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { useIncidentsRealtime } from "../realtime/useIncidentsRealtime";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { events, connected } = useIncidentsRealtime();
  const [notificationsState, setNotificationsState] = useState([]);

  useEffect(() => {
    const incoming = events
      .filter((e) => e.type === "incident.created")
      .map((e) => {
        console.log("[NotificationsContext] incident.created event:", JSON.stringify(e, null, 2));

        
        const toNumericId = (val) => {
          if (val == null) return null;
          const n = Number(val);
          return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : null;
        };

        
        const incidentId =
          toNumericId(e.id)                
          toNumericId(e.incidentId)      
          toNumericId(e.incident_id)     
          toNumericId(e.data?.id)        
          toNumericId(e.payload?.id)     
          null;

        console.log("[NotificationsContext] resolved incidentId:", incidentId, "from e.id:", e.id);

        return {
          id: `notif-${incidentId || Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: e.title || "New Incident Reported",
          body: e.description || e.body || `Severity: ${e.severity || "unknown"}`,
          createdAt: e.created_at || e.createdAt || new Date().toISOString(),
          severity: e.severity || "info",
          read: false,
          deleted: false,
          data: {
            
            incidentId,           
            address: e.address,
            severity: e.severity,
            status: e.status,
            title: e.title,
          },
        };
      });

    if (incoming.length === 0) return;

    setNotificationsState((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newOnes = incoming.filter((n) => !existingIds.has(n.id));
      if (newOnes.length === 0) return prev; // no change, avoid re-render
      return [...newOnes, ...prev];
    });
  }, [events]);

  const notifications = useMemo(
    () => notificationsState.filter((n) => !n.deleted),
    [notificationsState]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  
  const markAsRead = useCallback((id) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotificationsState((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, deleted: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotificationsState((prev) =>
      prev.map((n) => ({ ...n, deleted: true }))
    );
  }, []);

  const dismiss = useCallback((id) => {
    markAsRead(id);
  }, [markAsRead]);

  const addNotification = useCallback((n) => {
    const incidentId = n.incidentId || n.data?.incidentId || n.id || null;
    const notif = {
      id: n.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: n.title || "Notification",
      body: n.body || n.message || "",
      createdAt: n.createdAt || new Date().toISOString(),
      severity: n.severity || "info",
      read: false,
      deleted: false,
      data: {
        ...(n.data || n),
        incidentId, // normalised
      },
    };
    setNotificationsState((prev) => [notif, ...prev]);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        dismiss,
        addNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);

  if (!ctx) {
    console.warn("useNotifications used outside provider — returning no-op fallback");
    return {
      notifications: [],
      unreadCount: 0,
      connected: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
      clearAll: () => {},
      dismiss: () => {},
      addNotification: () => {},
    };
  }

  return ctx;
}