import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen — E2E Flow', () => {
  const mockPinMost = '11032005';
  const mockPinFern = '15092004';

  beforeEach(() => {
    vi.stubEnv('VITE_PIN_MOST', mockPinMost);
    vi.stubEnv('VITE_PIN_FERN', mockPinFern);

    useAuthStore.setState({
      currentUser: null,
      userProfile: null,
      isAuthenticated: false,
    });
  });

  it('should render the login form with correct elements', () => {
    render(<LoginScreen />);

    expect(screen.getByText('DUAL TODO')).toBeInTheDocument();
    expect(screen.getByLabelText(/birthday pin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/partner's birthday/i)).toBeInTheDocument();
  });

  it('should login successfully with correct PIN', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    const input = screen.getByLabelText(/birthday pin/i);
    await user.type(input, '11032005');
    await user.type(input, mockPinMost);

    const button = screen.getByRole('button', { name: /login/i });
    await user.click(button);

    // Auth store should be updated
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentUser).toBe('most');
  });

  it('should show error for incorrect PIN', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    const input = screen.getByLabelText(/birthday pin/i);
    await user.type(input, '99999999');

    const button = screen.getByRole('button', { name: /login/i });
    await user.click(button);

    expect(screen.getByText('Incorrect PIN. Please try again.')).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should disable the button when input is empty', () => {
    render(<LoginScreen />);
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeDisabled();
  });

  it('should clear error when user modifies input', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    const input = screen.getByLabelText(/birthday pin/i);
    await user.type(input, '00000000');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText('Incorrect PIN. Please try again.')).toBeInTheDocument();

    // Clear and type new value — error should clear
    await user.clear(input);
    await user.type(input, '1');
    expect(screen.queryByText('Incorrect PIN. Please try again.')).not.toBeInTheDocument();
  });

  it('should use all English text — no Thai characters', () => {
    render(<LoginScreen />);
    
    const html = document.body.innerHTML;
    // Check no Thai Unicode range characters exist
    const thaiPattern = /[\u0E00-\u0E7F]/;
    expect(thaiPattern.test(html)).toBe(false);
  });
});
