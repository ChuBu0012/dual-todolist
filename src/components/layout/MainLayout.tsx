import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
import { TodoList } from '../todo/TodoList';
import { SyncStatusIcon } from '../todo/SyncStatusIcon';
import { Sun, Moon } from 'lucide-react';

export function MainLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const userProfile = useAuthStore((s) => s.userProfile);
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
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--card-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '3px solid var(--border-color)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--card-bg)',
          zIndex: 45,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontFamily: 'Archivo Black, sans-serif',
              fontSize: '1.25rem',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            DUAL TODO
          </h1>
          <SyncStatusIcon state={syncState} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--border-color)',
              padding: '4px',
            }}
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
          </button>

          {/* User badge */}
          <div
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: '2px solid var(--border-color)',
              padding: '4px 10px',
              backgroundColor: currentUser === 'most' ? 'var(--border-color)' : 'var(--card-bg)',
              color: currentUser === 'most' ? 'var(--card-bg)' : 'var(--border-color)',
            }}
          >
            {userProfile?.name ?? currentUser}
          </div>

          <button
            className="rb-btn-ghost"
            onClick={logout}
            style={{
              fontSize: '0.75rem',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            OUT
          </button>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-color)',
        }}
      >
        <TodoList />
      </main>
    </div>
  )
}
