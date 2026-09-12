import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAuthPins, USERS, type UserRole, type UserProfile } from '../types/auth';

interface AuthState {
  currentUser: UserRole | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  
  loginWithPin: (pin: string) => { success: boolean; user?: UserRole; error?: string };
  logout: () => void;
  switchUser: (targetUser: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      userProfile: null,
      isAuthenticated: false,

      loginWithPin: (pin: string) => {
        const cleanPin = pin.trim();
        const authPins = getAuthPins();
        const user = authPins[cleanPin];

        if (user) {
          set({
            currentUser: user,
            userProfile: USERS[user],
            isAuthenticated: true,
          });
          return { success: true, user };
        }

        return {
          success: false,
          error: 'Incorrect PIN. Please try again.',
        };
      },

      logout: () => {
        set({
          currentUser: null,
          userProfile: null,
          isAuthenticated: false,
        });
      },

      switchUser: (targetUser: UserRole) => {
        set({
          currentUser: targetUser,
          userProfile: USERS[targetUser],
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'dual-todo-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

