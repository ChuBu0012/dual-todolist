import { useState } from 'react';
import { getLast30Days } from '../../utils/dateFormat';
import type { DailyStat } from '../../types/todo';

interface StatsViewProps {
  dailyStats: Record<string, DailyStat>;
  onBack: () => void;
}

function getColorLevel(count: number, user: 'most' | 'fern'): string {
  if (count === 0) return 'bg-white';
  if (count <= 2) return user === 'most' ? 'bg-red-200' : 'bg-green-200';
  if (count <= 5) return user === 'most' ? 'bg-red-400' : 'bg-green-400';
  return user === 'most' ? 'bg-red-600' : 'bg-green-600';
}

function HeatmapGrid({ user, days, stats }: {
  user: 'most' | 'fern';
  days: string[];
  stats: Record<string, DailyStat>;
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  
  const label = user === 'most' ? "MOST'S LOG" : "FERN'S LOG";
  const total = days.reduce((sum, d) => {
    const s = stats[d];
    return sum + (s ? (user === 'most' ? s.mostCount : s.fernCount) : 0);
  }, 0);

  const activeStat = activeDate ? stats[activeDate] : null;
  const activeCount = activeStat ? (user === 'most' ? activeStat.mostCount : activeStat.fernCount) : 0;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.75rem' }}>
        <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '1rem', margin: 0, textTransform: 'uppercase' }}>
          {label}
        </h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          {total} tasks in 30 days
        </span>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
        {days.map((date) => {
          const s = stats[date];
          const count = s ? (user === 'most' ? s.mostCount : s.fernCount) : 0;
          return (
            <div
              key={date}
              onMouseEnter={() => setActiveDate(date)}
              onMouseLeave={() => setActiveDate(null)}
              onClick={() => setActiveDate(date)}
              className={getColorLevel(count, user)}
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid var(--border-color)',
                flexShrink: 0,
                cursor: 'pointer',
                opacity: activeDate && activeDate !== date ? 0.4 : 1,
                transform: activeDate === date ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.1s ease-in-out',
                position: activeDate === date ? 'relative' : 'static',
                zIndex: activeDate === date ? 10 : 1
              }}
            />
          );
        })}
      </div>

      <div style={{ minHeight: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 'bold' }}>
        {activeDate ? (
          <span>
            {activeDate.split('-')[2]}/{activeDate.split('-')[1]}: {activeCount} task{activeCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span style={{ opacity: 0.5 }}>Hover or tap a square for details</span>
        )}
      </div>
    </div>
  );
}

export default function StatsView({ dailyStats, onBack }: StatsViewProps) {
  const days = getLast30Days();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <button
        onClick={onBack}
        className="rb-btn-secondary"
        style={{ marginBottom: '1.5rem', fontSize: '0.875rem', letterSpacing: '0.1em' }}
      >
        &lt; BACK TO LIST
      </button>

      <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '1.25rem', margin: '0 0 1.5rem 0', letterSpacing: '-0.01em' }}>
        ACTIVITY LOG — LAST 30 DAYS
      </h1>

      <HeatmapGrid user="most" days={days} stats={dailyStats} />
      <hr className="rb-divider" style={{ marginBottom: '1.5rem' }} />
      <HeatmapGrid user="fern" days={days} stats={dailyStats} />
    </div>
  );
}

