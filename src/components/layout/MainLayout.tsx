import { useEffect, useState, useRef, type ReactNode, type PointerEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
import { TodoList } from '../todo/TodoList';
import { AssigneeBadge } from "../todo/AssigneeBadge";

import { SyncStatusIcon } from '../todo/SyncStatusIcon';
import { Sun, Moon } from 'lucide-react';

interface MainLayoutProps {
  onLogoClick?: () => void;
  onLogoLongPress?: () => void;
  children?: ReactNode;
}

export function MainLayout({ onLogoClick, onLogoLongPress, children }: MainLayoutProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const initialize = useTodoStore((s) => s.initialize);
  const syncState = useTodoStore((s) => s.syncState);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const logoLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoStartPos = useRef<{ x: number; y: number } | null>(null);
  const isLogoLongPressTriggered = useRef(false);

  const startLogoLongPress = (e: PointerEvent<HTMLHeadingElement>) => {
    isLogoLongPressTriggered.current = false;
    logoStartPos.current = { x: e.clientX, y: e.clientY };

    logoLongPressTimer.current = setTimeout(() => {
      isLogoLongPressTriggered.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      if (onLogoLongPress) {
        onLogoLongPress();
      } else {
        window.location.href = '/dashboard.html';
      }
    }, 500);
  };

  const cancelLogoLongPress = () => {
    if (logoLongPressTimer.current) {
      clearTimeout(logoLongPressTimer.current);
      logoLongPressTimer.current = null;
    }
    logoStartPos.current = null;
  };

  const handleLogoPointerMove = (e: PointerEvent<HTMLHeadingElement>) => {
    if (!logoStartPos.current || !logoLongPressTimer.current) return;
    const dx = e.clientX - logoStartPos.current.x;
    const dy = e.clientY - logoStartPos.current.y;
    if (Math.hypot(dx, dy) > 10) {
      cancelLogoLongPress();
    }
  };

  const handleLogoPointerUp = () => {
    cancelLogoLongPress();
  };

  const handleLogoClick = () => {
    if (isLogoLongPressTriggered.current) {
      isLogoLongPressTriggered.current = false;
      return;
    }
    onLogoClick?.();
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return (
    <div className="min-h-[100dvh] bg-[var(--card-bg)] flex flex-col">
      {/* Top Navbar */}
      <header className="border-b-[3px] border-[var(--border-color)] py-3 px-4 flex items-center justify-between sticky top-0 bg-[var(--card-bg)] z-45">
        <div className="flex items-center gap-2.5">
          <h1
            style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '1.25rem', margin: 0, letterSpacing: '-0.01em' }}
            className={`flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform`}
            onPointerDown={startLogoLongPress}
            onPointerMove={handleLogoPointerMove}
            onPointerUp={handleLogoPointerUp}
            onPointerCancel={cancelLogoLongPress}
            onClick={handleLogoClick}
            title="Click: Activity Log | Hold 500ms: Analytics Dashboard"
          >
            DUAL TODO
          </h1>
          <SyncStatusIcon state={syncState} />
        </div>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(prev => !prev)}
            className="bg-none border-none cursor-pointer flex items-center justify-center text-[var(--icon-color)] p-1"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
          </button>

          {/* User badge */}
          {currentUser && (
            <AssigneeBadge assignee={currentUser as any} size="medium" />
          )}

          <button
            className="rb-btn-ghost text-[0.75rem] no-underline tracking-[0.05em]"
            onClick={logout}
          >
            OUT
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 overflow-y-auto bg-[var(--bg-color)]">
        {children ?? <TodoList />}
      </main>
    </div>
  )
}
