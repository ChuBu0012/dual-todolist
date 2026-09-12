import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { USERS } from '../types/auth';

describe('AuthStore', () => {
  const mockPinMost = 'pin-most-123';
  const mockPinFern = 'pin-fern-456';

  beforeEach(() => {
    vi.stubEnv('VITE_PIN_MOST', mockPinMost);
    vi.stubEnv('VITE_PIN_FERN', mockPinFern);

    useAuthStore.setState({
      currentUser: null,
      userProfile: null,
      isAuthenticated: false,
    });
  });

  it('should login successfully with Most configured PIN', () => {
    const { loginWithPin } = useAuthStore.getState();
    const result = loginWithPin(mockPinMost);

    const state = useAuthStore.getState();
    
    expect(result.success).toBe(true);
    expect(result.user).toBe('most');
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentUser).toBe('most');
    expect(state.userProfile).toEqual(USERS.most);
  });

  it('should login successfully with Fern configured PIN', () => {
    const { loginWithPin } = useAuthStore.getState();
    const result = loginWithPin(mockPinFern);

    const state = useAuthStore.getState();
    
    expect(result.success).toBe(true);
    expect(result.user).toBe('fern');
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentUser).toBe('fern');
  });

  it('should fail login with incorrect PIN', () => {
    const { loginWithPin } = useAuthStore.getState();
    const result = loginWithPin('wrong-pin-000');

    const state = useAuthStore.getState();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Incorrect PIN. Please try again.');
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
  });

  it('should clear state on logout', () => {
    const { loginWithPin, logout } = useAuthStore.getState();
    
    // Login first
    loginWithPin(mockPinMost);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    logout();
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
    expect(state.userProfile).toBeNull();
  });
});
