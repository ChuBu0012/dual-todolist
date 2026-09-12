export type UserRole = 'most' | 'fern';

export interface UserProfile {
  id: UserRole;
  name: string;
  partnerName: string;
  color: string;
}

export const USERS: Record<UserRole, UserProfile> = {
  most: {
    id: 'most',
    name: 'Most',
    partnerName: 'Fern',
    color: '#3b82f6',
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    partnerName: 'Most',
    color: '#ec4899',
  },
};

/**
 * Dynamically resolves PIN mapping from environment variables.
 * VITE_PIN_MOST logs into Most's account.
 * VITE_PIN_FERN logs into Fern's account.
 */
export const getAuthPins = (): Record<string, UserRole> => {
  const pins: Record<string, UserRole> = {};
  const mostPin = import.meta.env.VITE_PIN_MOST;
  const fernPin = import.meta.env.VITE_PIN_FERN;

  if (mostPin) {
    pins[String(mostPin).trim()] = 'most';
  }
  if (fernPin) {
    pins[String(fernPin).trim()] = 'fern';
  }

  return pins;
};
