// src/modules/realtime/components/RealtimeAlerts.jsx
import { useEffect, useState } from 'react';

export default function RealtimeAlerts({ 
  alerts = [], 
  onAlertAcknowledge,
  autoRefresh = true,
  refreshInterval = 30000 
}) {
  const [localAlerts, setLocalAlerts] = useState(alerts);

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // In real app: fetch new alerts from WebSocket/API
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (localAlerts.length === 0) {
    return (
      <div data-testid="realtime-alerts" className="p-4 text-center text-zinc-500">
        No active alerts
      </div>
    );
  }

  return (
    <div data-testid="realtime-alerts" className="space-y-2">
      {localAlerts.map((alert) => (
        <div 
          key={alert.id} 
          data-testid={`alert-${alert.id}`}
          className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3"
        >
          <div>
            <p className="font-semibold text-red-400">{alert.title}</p>
            <p className="text-sm text-zinc-400">{alert.message}</p>
            <p className="text-xs text-zinc-500">{alert.timestamp}</p>
          </div>
          {onAlertAcknowledge && (
            <button
              data-testid={`acknowledge-${alert.id}`}
              onClick={() => onAlertAcknowledge(alert.id)}
              className="rounded bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/30"
            >
              Acknowledge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}