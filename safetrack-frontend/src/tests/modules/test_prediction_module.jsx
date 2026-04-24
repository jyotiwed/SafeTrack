// src/tests/modules/test_prediction_module.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PredictionDashboard from '../../modules/predictions/PredictionsPanel';
import RiskBadge from '../../modules/predictions/components/RiskBadge';
import PredictionChart from '../../modules/predictions/components/PredictionChart';

describe('Prediction Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display risk predictions', async () => {
    const mockPredictions = [
      { id: 1, type: 'flood', risk: 0.75 },
      { id: 2, type: 'earthquake', risk: 0.45 }
    ];
    render(<PredictionDashboard predictions={mockPredictions} />);
    await waitFor(() => {
      expect(screen.getByText(/flood/i)).toBeInTheDocument();
      expect(screen.getByText(/earthquake/i)).toBeInTheDocument();
    });
  });

  it('should show risk level badge', () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText('HIGH')).toHaveClass('bg-red-500');
  });

  it('should display prediction charts', () => {
    const mockChartData = [{ label: 'Jan', value: 10 }];
    render(<PredictionChart data={mockChartData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });
});