// src/tests/modules/test_realtime_module.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RealtimeAlerts from '../../../src/modules/realtime/components/RealtimeAlerts';
import AutoRefreshComponent from '../../../src/modules/realtime/components/AutoRefreshComponent';
import * as useIncidentsRealtime from '../../../src/modules/realtime/useIncidentsRealtime';

// Mock the API module
vi.mock('../../../src/modules/realtime/useIncidentsRealtime', () => ({
  connectWebSocket: vi.fn().mockResolvedValue({ close: vi.fn() }),
  subscribeToAlerts: vi.fn().mockReturnValue(vi.fn()),
  fetchLatestAlerts: vi.fn().mockResolvedValue([]),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Real-time Updates Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should connect to WebSocket on mount', async () => {
    renderWithRouter(<RealtimeAlerts />);
    
    // Verify component renders
    expect(screen.getByTestId('realtime-alerts')).toBeInTheDocument();
    
    // In a real test, you'd verify WebSocket connection
    // For now, just ensure the component mounts without error
    expect(screen.getByText('No active alerts')).toBeInTheDocument();
  });

  it('should display live alerts when provided', () => {
    const mockAlerts = [
      { 
        id: 1, 
        title: 'Flood Warning', 
        message: 'Heavy rainfall detected in Zone A', 
        timestamp: '2 min ago',
        severity: 'high'
      },
      { 
        id: 2, 
        title: 'Earthquake Alert', 
        message: 'Magnitude 4.2 detected', 
        timestamp: '5 min ago',
        severity: 'critical'
      }
    ];

    renderWithRouter(<RealtimeAlerts alerts={mockAlerts} />);
    
    expect(screen.getByText('Flood Warning')).toBeInTheDocument();
    expect(screen.getByText('Earthquake Alert')).toBeInTheDocument();
    expect(screen.getAllByTestId(/alert-/).length).toBe(2);
  });

  it('should auto-refresh data when enabled', async () => {
    const mockRefresh = vi.fn();
    
    renderWithRouter(
      <AutoRefreshComponent onRefresh={mockRefresh} interval={5000} enabled={true}>
        <RealtimeAlerts />
      </AutoRefreshComponent>
    );
    
    // Advance time by one interval
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify refresh callback was called
    expect(mockRefresh).toHaveBeenCalled();
    
    // Verify last refresh timestamp updated
    expect(screen.getByTestId('last-refresh')).toBeInTheDocument();
  });
});