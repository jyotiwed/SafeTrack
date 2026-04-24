// src/tests/modules/test_auth_module.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../../modules/auth/components/LoginForm';
import RegisterForm from '../../modules/auth/components/RegisterForm';
import * as authApi from '../../modules/auth/api/authApi';

vi.mock('../../modules/auth/api/authApi', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('renders login form with email and password fields', () => {
      renderWithRouter(<LoginForm />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('accepts email input', async () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      expect(emailInput.value).toBe('test@example.com');
    });

    it('accepts password input', async () => {
      renderWithRouter(<LoginForm />);
      
      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'password123');
      expect(passwordInput.value).toBe('password123');
    });

    it('shows error on failed submission', async () => {
      // ✅ Fixed: proper nested structure matching your component's error handling
      vi.mocked(authApi.loginRequest).mockRejectedValue({
        response: { data: { detail: 'Invalid credentials' } },
      });

      renderWithRouter(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('calls login API on form submission', async () => {
      vi.mocked(authApi.loginRequest).mockResolvedValue({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_type: 'bearer',
      });
      
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      
      // ✅ Fixed: click the submit button instead of querying form by role
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(authApi.loginRequest).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('RegisterForm', () => {
    it('renders registration form with all fields', () => {
      renderWithRouter(<RegisterForm />);
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
      renderWithRouter(<RegisterForm />);
      
      await userEvent.type(screen.getByLabelText('Password'), 'password123');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'different');
      
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
      });
    });

    it('calls register API with correct data', async () => {
      vi.mocked(authApi.registerRequest).mockResolvedValue({
        email: 'new@example.com',
        full_name: 'New User',
        role: 'citizen',
        id: 1,
        is_active: true,
      });
      
      vi.mocked(authApi.loginRequest).mockResolvedValue({
        access_token: 'mock-token',
      });
      
      renderWithRouter(<RegisterForm />);
      
      await userEvent.type(screen.getByLabelText('Full Name'), 'New User');
      await userEvent.type(screen.getByLabelText('Email Address'), 'new@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password123');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
      
      const roleSelect = screen.getByLabelText('Role');
      await userEvent.selectOptions(roleSelect, 'citizen');
      
      // ✅ Fixed: click submit button, not form by role
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(authApi.registerRequest).toHaveBeenCalledWith({
          email: 'new@example.com',
          full_name: 'New User',
          role: 'citizen',
          password: 'password123',
        });
      });
    });
  });
});history