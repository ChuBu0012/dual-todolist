import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
import { TodoList } from '../todo/TodoList';
import { AssigneeBadge } from "../todo/AssigneeBadge";

import { SyncStatusIcon } from '../todo/SyncStatusIcon';
import { Sun, Moon } from 'lucide-react';

export function MainLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const initialize = useTodoStore((s) => s.initialize);
  const syncState = useTodoStore((s) => s.syncState);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
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
          <h1 className="font-archivo-black text-[1.25rem] m-0 tracking-[-0.01em] flex items-center gap-2">
            DUAL TODO
          </h1>
          <SyncStatusIcon state={syncState} />
        </div>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(prev => !prev)}
            className="bg-none border-none cursor-pointer flex items-center justify-center text-[var(--border-color)] p-1"
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
        <TodoList />
      </main>
    </div>
  )
}
