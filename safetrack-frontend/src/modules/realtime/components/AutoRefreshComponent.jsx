// src/modules/realtime/components/AutoRefreshComponent.jsx
import { useEffect, useState } from 'react';

export default function AutoRefreshComponent({ 
  children, 
  onRefresh, 
  interval = 30000,
  enabled = true 
}) {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (!enabled) return;
    
    const timer = setInterval(() => {
      setLastRefresh(new Date());
      onRefresh?.();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, onRefresh]);

  return (
    <div data-testid="auto-refresh-wrapper">
      {children}
      {enabled && (
        <span data-testid="last-refresh" className="text-xs text-zinc-500">
          Updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}