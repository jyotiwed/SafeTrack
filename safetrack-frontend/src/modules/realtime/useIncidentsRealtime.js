import { useEffect, useRef, useState, useCallback } from "react";

const RECONNECT_BASE_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const BACKOFF_FACTOR = 1.7;
const HEARTBEAT_INTERVAL = 25000;


export function useIncidentsRealtime() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const socketRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isMountedRef = useRef(false);

  const getToken = () => localStorage.getItem("access_token");

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const token = getToken();
    if (!token) {
      setError("No access token found");
      setConnected(false);
      return;
    }

    // 🔥 Close existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_API_HOST || "localhost:8000";
    const url = `${protocol}//${host}/api/v1/realtime/incidents?token=${encodeURIComponent(token)}`;

    console.log("[WS] Connecting →", url.replace(/token=.*$/, "token=***"));

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WS]  Connected");
      setConnected(true);
      setError(null);

      reconnectCountRef.current = 0;
      setReconnectCount(0);

      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === "incident.created") {
          setEvents(prev => [parsed, ...prev]);
        }
      } catch (err) {
        // ignore non-JSON
      }
    };

    ws.onerror = () => {
      setError("Connection error");
      setConnected(false);
    };

    ws.onclose = (ev) => {
      console.log(`[WS] Closed → code=${ev.code}`);

      setConnected(false);

      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);

      if (!isMountedRef.current) return;

      if (ev.code !== 1000 &&
          reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {

        reconnectCountRef.current += 1;
        setReconnectCount(reconnectCountRef.current);

        const delay =
          RECONNECT_BASE_DELAY *
          Math.pow(BACKOFF_FACTOR, reconnectCountRef.current);

        console.log(`[WS] Reconnecting in ${Math.round(delay / 1000)}s...`);

        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, []); 
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;

      if (reconnectTimerRef.current)
        clearTimeout(reconnectTimerRef.current);

      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);

      if (socketRef.current)
        socketRef.current.close(1000, "Component unmounted");
    };
  }, [connect]);

  const reconnect = () => {
    reconnectCountRef.current = 0;
    setReconnectCount(0);
    setError(null);

    if (socketRef.current)
      socketRef.current.close(1000, "Manual reconnect");

    connect();
  };

  const clearEvents = () => setEvents([]);

  return {
    events,
    connected,
    error,
    reconnectCount,
    reconnect,
    clearEvents,
  };
}
