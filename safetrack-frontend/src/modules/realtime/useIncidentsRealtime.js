// src/modules/realtime/useIncidentsRealtime.js
import { useEffect, useRef, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";  // Add this import (install jwt-decode if needed)

const RECONNECT_BASE_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 12;
const BACKOFF_FACTOR = 1.6;
const HEARTBEAT_INTERVAL = 25000;    // send ping every 25s
const HEARTBEAT_TIMEOUT = 15000;     // consider dead if no pong in 15s
const BATCH_DEBOUNCE_MS = 300;       // batch events arriving within 300ms
const TOKEN_REFRESH_MARGIN = 60000;  // Refresh 1 min before expiration

export function useIncidentsRealtime() {
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const batchTimerRef = useRef(null);
  const tokenRefreshTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("access_token") || null;
  }, []);

  const refreshToken = useCallback(async () => {
    // Assuming you have a refresh endpoint; replace with actual API call
    // e.g., const response = await fetch('/api/refresh', { method: 'POST', credentials: 'include' });
    // const { access_token } = await response.json();
    // localStorage.setItem('access_token', access_token);
    // return access_token;

    // For demo, simulate refresh (in real app, implement proper refresh)
    console.log("[WS] Simulating token refresh");
    return getAuthToken();  // Replace with actual refresh logic
  }, [getAuthToken]);

  const scheduleTokenRefresh = useCallback((token) => {
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);

    try {
      const { exp } = jwtDecode(token);
      const expTime = exp * 1000;
      const now = Date.now();
      const refreshIn = expTime - now - TOKEN_REFRESH_MARGIN;

      if (refreshIn > 0) {
        tokenRefreshTimerRef.current = setTimeout(async () => {
          console.log("[WS] Token nearing expiration → refreshing");
          const newToken = await refreshToken();
          if (newToken && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.close(4002, "Token refresh");  // Custom code for refresh
          }
        }, refreshIn);
      } else {
        console.warn("[WS] Token already expired or invalid");
        if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.close(4003, "Token expired");
      }
    } catch (err) {
      console.error("[WS] JWT decode error:", err);
      setError("Invalid authentication token");
    }
  }, [refreshToken]);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const token = getAuthToken();
    setIsAuthenticated(!!token);

    if (!token) {
      setError("No authentication token found. Please log in again.");
      return;
    }

    scheduleTokenRefresh(token);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${import.meta.env.VITE_API_HOST || "localhost:8000"}/api/v1/realtime/incidents?token=${encodeURIComponent(token)}`;

    console.log("[WS] Connecting to:", url.replace(/token=.*$/, "token=***"));

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected");
      setConnected(true);
      setError(null);
      setReconnectCount(0);

      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log("[WS] Sending ping");
          ws.send(JSON.stringify({ type: "ping" }));
          // Start timeout after each ping
          if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
          heartbeatTimeoutRef.current = setTimeout(() => {
            console.warn("[WS] No pong received → reconnecting");
            ws.close(4001, "No heartbeat response");
          }, HEARTBEAT_TIMEOUT);
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string" && event.data.includes('"type":"pong"')) {
        console.log("[WS] Received pong");
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        return;
      }

      let parsed;
      try {
        if (typeof event.data === "string") {
          parsed = JSON.parse(event.data);
        } else if (event.data instanceof Blob) {
          event.data.text().then((text) => {
            try {
              processEvent(JSON.parse(text));
            } catch (err) {
              console.error("[WS] Blob parse error:", err);
            }
          });
          return;
        } else {
          console.warn("[WS] Unexpected message type:", typeof event.data);
          return;
        }
      } catch (err) {
        console.error("[WS] Message parse error:", err);
        return;
      }

      if (parsed) processEvent(parsed);
    };

    function processEvent(ev) {
      setPendingEvents((prev) => [...prev, ev]);
      setLastEventTime(new Date());

      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(() => {
          setEvents((prev) => [...pendingEvents, ...prev]);  // Prepend new events for reverse chronological
          setPendingEvents([]);
          batchTimerRef.current = null;
        }, BATCH_DEBOUNCE_MS);
      }
    }

    ws.onerror = (event) => {
      console.error("[WS] Error event:", event);
      setError("WebSocket connection error. Check if server is running and URL is correct.");
      setConnected(false);
    };

    ws.onclose = (ev) => {
      console.log(`[WS] Closed - code: ${ev.code}, reason: "${ev.reason || 'none'}", clean: ${ev.wasClean}`);
      setConnected(false);

      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);

      if (isMountedRef.current && (ev.code !== 1000) && reconnectCount < MAX_RECONNECT_ATTEMPTS) {  // Reconnect only on abnormal close
        const delay = RECONNECT_BASE_DELAY * Math.pow(BACKOFF_FACTOR, reconnectCount);
        console.log(`[WS] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectCount + 1}/${MAX_RECONNECT_ATTEMPTS})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectCount((c) => c + 1);
          connect();
        }, delay);
      } else if (reconnectCount >= MAX_RECONNECT_ATTEMPTS) {
        setError("Max reconnection attempts reached. Please refresh the page or check your connection.");
      } else if (ev.code === 1000) {
        console.log("[WS] Clean close - no reconnect");
      }
    };
  }, [reconnectCount, getAuthToken, refreshToken, scheduleTokenRefresh]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);

      if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) {
        socketRef.current.close(1000, "Component unmounted");
      }
      socketRef.current = null;
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, "Manual reconnect");
    }
    setReconnectCount(0);
    setError(null);
    connect();
  }, [connect]);

  const clearEvents = () => setEvents([]);

  return {
    events,
    connected,
    error,
    reconnectCount,
    reconnect,
    clearEvents,
    isAuthenticated,
    lastEventTime,
  };
}