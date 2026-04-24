// src/tests/modules/test_task_module.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TasksPage from '../../modules/tasks/pages/TasksPage';
import IncidentTasksPanel from '../../modules/tasks/components/IncidentTasksPanel';
import * as taskApi from '../../modules/tasks/api/taskApi';

vi.mock('../../modules/tasks/api/taskApi');

// Proper module-level mock for react-router-dom so useNavigate can be spied on
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

const mockTask = {
  id: 1,
  title: 'Deploy rescue team',
  description: 'Send team to affected area',
  priority: 'high',
  status: 'pending',
  incident_id: 101,
  assignee_id: 5,
  created_at: '2026-02-18T10:00:00Z',
  updated_at: '2026-02-18T10:00:00Z',
};

describe('Task Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TasksPage', () => {
    it('renders tasks page with filter controls', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([]);
      
      renderWithRouter(<TasksPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/incident id/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/assignee id/i)).toBeInTheDocument();
      });
    });

    it('applies status filter correctly', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([mockTask]);
      
      renderWithRouter(<TasksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Deploy rescue team')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText(/status/i);
      await userEvent.selectOptions(statusSelect, 'in_progress');
      
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await userEvent.click(applyButton);
      
      await waitFor(() => {
        expect(taskApi.listTasks).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'in_progress' })
        );
      });
    });

    it('resets all filters when reset clicked', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([mockTask]);
      
      renderWithRouter(<TasksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Deploy rescue team')).toBeInTheDocument();
      });
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await userEvent.click(resetButton);
      
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toHaveValue('all');
    });

    it('navigates to incident page when task clicked', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([mockTask]);
      
      renderWithRouter(<TasksPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Deploy rescue team')).toBeInTheDocument();
      });
      
      const taskCard = screen.getByText('Deploy rescue team').closest('button');
      await userEvent.click(taskCard);
      
      expect(mockNavigate).toHaveBeenCalledWith('/app/incidents/101', expect.any(Object));
    });
  });

  describe('IncidentTasksPanel', () => {
    it('renders task panel for incident', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([mockTask]);
      
      renderWithRouter(<IncidentTasksPanel incidentId={101} />);
      
      await waitFor(() => {
        expect(screen.getByText('Incident Tasks')).toBeInTheDocument();
        expect(screen.getByText('Deploy rescue team')).toBeInTheDocument();
      });
    });

    it('creates new task successfully', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([]);
      taskApi.createTask = vi.fn().mockResolvedValue({
        ...mockTask,
        id: 2,
        title: 'New task',
      });
      
      renderWithRouter(<IncidentTasksPanel incidentId={101} />);
      
      await userEvent.type(screen.getByPlaceholderText(/enter task title/i), 'New task');
      
      const submitButton = screen.getByRole('button', { name: /add task/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(taskApi.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New task',
            incident_id: 101,
          })
        );
      });
    });

    it('updates task status when changed', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([mockTask]);
      taskApi.updateTask = vi.fn().mockResolvedValue({
        ...mockTask,
        status: 'in_progress',
      });
      
      renderWithRouter(<IncidentTasksPanel incidentId={101} />);
      
      await waitFor(() => {
        expect(screen.getByText('Deploy rescue team')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(statusSelect, 'in_progress');
      
      await waitFor(() => {
        expect(taskApi.updateTask).toHaveBeenCalledWith(1, { status: 'in_progress' });
      });
    });

    it('displays priority badges correctly', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([mockTask]);
      
      renderWithRouter(<IncidentTasksPanel incidentId={101} />);
      
      await waitFor(() => {
        expect(screen.getByText('High')).toBeInTheDocument();
      });
    });

    it('shows empty state when no tasks', async () => {
      taskApi.listTasks = vi.fn().mockResolvedValue([]);
      
      renderWithRouter(<IncidentTasksPanel incidentId={101} />);
      
      await waitFor(() => {
        expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      });
    });
  });
});