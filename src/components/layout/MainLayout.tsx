import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
import { TodoList } from '../todo/TodoList';
import { SyncStatusIcon } from '../todo/SyncStatusIcon';

export function MainLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const userProfile = useAuthStore((s) => s.userProfile);
  const logout = useAuthStore((s) => s.logout);
  const initialize = useTodoStore((s) => s.initialize);
  const syncState = useTodoStore((s) => s.syncState);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '3px solid #000',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User badge */}
          <SyncStatusIcon state={syncState} />
          <div
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: '2px solid #000',
              padding: '4px 10px',
              backgroundColor: currentUser === 'most' ? '#000' : '#fff',
              color: currentUser === 'most' ? '#fff' : '#000',
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
          backgroundColor: '#f9f9f9',
        }}
      >
        <TodoList />
      </main>
    </div>
  )
}
