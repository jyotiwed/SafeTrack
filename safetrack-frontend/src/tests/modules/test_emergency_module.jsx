// src/tests/modules/test_emergency_module.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SOSTrigger from '../../modules/emergency/components/SOSTrigger';
import EmergencyContacts from '../../modules/emergency/components/EmergencyContacts';
import * as emergencyApi from '../../modules/emergency/api/emergencyApi';

vi.mock('../../modules/emergency/api/emergencyApi');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Emergency Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SOSTrigger', () => {
    it('renders SOS button prominently', () => {
      renderWithRouter(<SOSTrigger />);
      
      expect(screen.getByRole('button', { name: /sos/i })).toBeInTheDocument();
    });

    it('captures location on SOS trigger', async () => {
      const mockTriggerSOS = vi.fn().mockResolvedValue({ message: 'SOS sent' });
      emergencyApi.triggerSOS = mockTriggerSOS;
      
      // Mock navigator.geolocation
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 19.0760,
              longitude: 72.8777,
            },
          });
        }),
      };
      navigator.geolocation = mockGeolocation;
      
      renderWithRouter(<SOSTrigger />);
      
      const sosButton = screen.getByRole('button', { name: /sos/i });
      await userEvent.click(sosButton);
      
      await waitFor(() => {
        expect(mockTriggerSOS).toHaveBeenCalledWith({
          latitude: 19.0760,
          longitude: 72.8777,
          message: expect.any(String),
        });
      });
    });

    it('displays confirmation after SOS sent', async () => {
      emergencyApi.triggerSOS = vi.fn().mockResolvedValue({ message: 'SOS sent' });
      
      renderWithRouter(<SOSTrigger />);
      
      const sosButton = screen.getByRole('button', { name: /sos/i });
      await userEvent.click(sosButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sos sent/i)).toBeInTheDocument();
      });
    });

    it('handles location permission denied', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({ code: 1, message: 'Permission denied' });
        }),
      };
      navigator.geolocation = mockGeolocation;
      
      renderWithRouter(<SOSTrigger />);
      
      const sosButton = screen.getByRole('button', { name: /sos/i });
      await userEvent.click(sosButton);
      
      await waitFor(() => {
        expect(screen.getByText(/location access required/i)).toBeInTheDocument();
      });
    });
  });

  describe('EmergencyContacts', () => {
    const mockContacts = [
      { id: 1, name: 'John Doe', phone: '9876543210', relationship: 'Father' },
      { id: 2, name: 'Jane Doe', phone: '9876543211', relationship: 'Mother' },
    ];

    it('renders emergency contacts list', async () => {
      emergencyApi.getEmergencyContacts = vi.fn().mockResolvedValue(mockContacts);
      
      renderWithRouter(<EmergencyContacts />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    });

    it('adds new emergency contact', async () => {
      emergencyApi.getEmergencyContacts = vi.fn().mockResolvedValue([]);
      emergencyApi.createEmergencyContact = vi.fn().mockResolvedValue({
        id: 1,
        name: 'Emergency Contact',
        phone: '9999999999',
        relationship: 'Friend',
      });
      
      renderWithRouter(<EmergencyContacts />);
      
      await userEvent.type(screen.getByPlaceholderText(/name/i), 'Emergency Contact');
      await userEvent.type(screen.getByPlaceholderText(/phone/i), '9999999999');
      await userEvent.type(screen.getByPlaceholderText(/relationship/i), 'Friend');
      
      const addButton = screen.getByRole('button', { name: /add contact/i });
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(emergencyApi.createEmergencyContact).toHaveBeenCalledWith({
          name: 'Emergency Contact',
          phone: '9999999999',
          relationship: 'Friend',
        });
      });
    });

    it('validates phone number format', async () => {
      emergencyApi.getEmergencyContacts = vi.fn().mockResolvedValue([]);
      
      renderWithRouter(<EmergencyContacts />);
      
      const phoneInput = screen.getByPlaceholderText(/phone/i);
      await userEvent.type(phoneInput, '123');
      
      expect(phoneInput).toHaveAttribute('minlength', '5');
      expect(phoneInput).toHaveAttribute('maxlength', '20');
    });

    it('deletes emergency contact', async () => {
      emergencyApi.getEmergencyContacts = vi.fn().mockResolvedValue(mockContacts);
      emergencyApi.deleteEmergencyContact = vi.fn().mockResolvedValue(undefined);
      
      renderWithRouter(<EmergencyContacts />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(emergencyApi.deleteEmergencyContact).toHaveBeenCalledWith(1);
      });
    });
  });
});