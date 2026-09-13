import { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useTodoStore } from './store/todoStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import StatsView from './components/stats/StatsView';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const dailyStats = useTodoStore((s) => s.dailyStats);
  const [view, setView] = useState<'todo' | 'stats'>('todo');

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <MainLayout onLogoClick={() => setView(v => v === 'todo' ? 'stats' : 'todo')}>
      {view === 'stats'
        ? <StatsView dailyStats={dailyStats} onBack={() => setView('todo')} />
        : null
      }
    </MainLayout>
  );
}
