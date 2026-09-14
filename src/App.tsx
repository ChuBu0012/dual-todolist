import { useState, useMemo } from 'react';
import { useAuthStore } from './store/authStore';
import { useTodoStore } from './store/todoStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import StatsView from './components/stats/StatsView';
import { getBangkokDateString } from './utils/dateFormat';
import type { DailyStat } from './types/todo';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cards = useTodoStore((s) => s.cards);
  
  const dailyStats = useMemo(() => {
    const stats: Record<string, DailyStat> = {};
    for (const card of cards) {
      for (const item of card.items) {
        if (item.isDone && item.completedAt && item.completedBy) {
          try {
            const dateStr = getBangkokDateString(new Date(item.completedAt));
            if (!stats[dateStr]) {
              stats[dateStr] = { date: dateStr, mostCount: 0, fernCount: 0 };
            }
            if (item.completedBy === 'most') stats[dateStr].mostCount++;
            if (item.completedBy === 'fern') stats[dateStr].fernCount++;
          } catch (e) {
            // invalid date, ignore
          }
        }
      }
    }
    return stats;
  }, [cards]);

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
