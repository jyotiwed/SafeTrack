// src/tests/modules/test_incident_module.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncidentCreationForm from '../../../src/modules/incidents/components/IncidentForm';
import IncidentListView from '../../../src/modules/incidents/pages/IncidentsPage';
import IncidentFilters from '../../../src/modules/incidents/pages/IncidentDetailPage';

describe('Incident Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render incident creation form', () => {
    render(<IncidentCreationForm />);
    expect(screen.getByPlaceholderText(/title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
  });

  it('should submit incident data', async () => {
    const mockSubmit = vi.fn();
    render(<IncidentCreationForm onSubmit={mockSubmit} />);

    await userEvent.type(screen.getByPlaceholderText(/title/i), 'Flood Alert');
    await userEvent.type(screen.getByPlaceholderText(/description/i), 'Major flooding');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalled();
  });

  it('should display incident list', () => {
    const mockIncidents = [
      { id: 1, title: 'Test Incident', status: 'active' }
    ];
    render(<IncidentListView incidents={mockIncidents} />);
    expect(screen.getByText('Test Incident')).toBeInTheDocument();
  });

  it('should filter incidents by type', async () => {
    render(<IncidentFilters />);
    const floodFilter = screen.getByRole('checkbox', { name: /flood/i });
    await userEvent.click(floodFilter);
    expect(floodFilter).toBeChecked();
  });
});