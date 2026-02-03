import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useIncidentsRealtime } from "../realtime/useIncidentsRealtime";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { events, connected } = useIncidentsRealtime();
  const [notificationsState, setNotificationsState] = useState([]);

  useEffect(() => {
    const incoming = events
      .filter((e) => e.type === "incident.created")
      .map((e) => ({
        id: `incident-${e.id || e.incidentId || Date.now() + Math.random()}`,
        title: e.title || "New Incident Reported",
        body: e.description || `Severity: ${e.severity || "unknown"}`,
        createdAt: e.created_at || new Date().toISOString(),
        data: e,
        read: false,
        deleted: false,
      }));

    setNotificationsState((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newOnes = incoming.filter((n) => !existingIds.has(n.id));
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

  const markAsRead = (id) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotificationsState((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, deleted: true } : n))
    );
  };

  const clearAll = () => {
    setNotificationsState((prev) => prev.map((n) => ({ ...n, deleted: true })));
  };

  const dismiss = (id) => {
    markAsRead(id);
    // removeNotification(id); // optional
  };

  // Integrated testNotification function (for simulating notifications during testing)
  const testNotification = () => {
    // Simulate incoming event
    const mockEvent = {
      id: Date.now(),
      title: "Test Notification",
      body: "This is a test message.",
      createdAt: new Date().toISOString(),
      read: false,
      deleted: false,
    };
    // Add the mock notification to the state
    setNotificationsState((prev) => [mockEvent, ...prev]);
  };

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
        testNotification,  // Expose the test function for use in components
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    console.warn("useNotifications used outside provider");
    return {
      notifications: [],
      unreadCount: 0,
      connected: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
      clearAll: () => {},
      dismiss: () => {},
      testNotification: () => {},
    };
  }
  return ctx;
}