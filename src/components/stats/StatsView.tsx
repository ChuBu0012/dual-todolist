import { useState, useRef, useEffect } from 'react';
import { getLast30Days } from '../../utils/dateFormat';
import type { DailyStat } from '../../types/todo';

interface StatsViewProps {
  dailyStats: Record<string, DailyStat>;
  onBack: () => void;
}

function HeatmapGrid({ user, days, stats }: {
  user: 'most' | 'fern';
  days: string[];
  stats: Record<string, DailyStat>;
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const label = user === 'most' ? "MOST'S LOG" : "FERN'S LOG";
  const userColor = user === 'most' ? 'bg-red-500' : 'bg-green-500';
  
  let total = 0;
  let maxCount = 1; // minimum scale

  days.forEach(d => {
    const s = stats[d];
    const c = s ? (user === 'most' ? s.mostCount : s.fernCount) : 0;
    total += c;
    if (c > maxCount) maxCount = c;
  });

  useEffect(() => {
    if (scrollRef.current) {
      // Auto-scroll to the far right (newest dates) after render
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 50);
    }
  }, [days]);

  const activeStat = activeDate ? stats[activeDate] : null;
  const activeCount = activeStat ? (user === 'most' ? activeStat.mostCount : activeStat.fernCount) : 0;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '1rem', margin: 0, textTransform: 'uppercase' }}>
          {label}
        </h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          {total} tasks in 30 days
        </span>
      </div>
      
      {/* Scrollable Bar Chart Container */}
      <div 
        ref={scrollRef}
        className="hide-scrollbar"
        style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: '6px', 
          overflowX: 'auto', 
          paddingBottom: '8px',
          height: '120px',
          paddingTop: '20px' 
        }}
      >
        {days.map((date) => {
          const s = stats[date];
          const count = s ? (user === 'most' ? s.mostCount : s.fernCount) : 0;
          const heightPerc = count === 0 ? '8px' : `${Math.max(15, (count / maxCount) * 100)}%`;
          
          return (
            <div
              key={date}
              onMouseEnter={() => setActiveDate(date)}
              onMouseLeave={() => setActiveDate(null)}
              onClick={() => setActiveDate(date)}
              style={{
                width: '24px',
                flexShrink: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div 
                className={count > 0 ? userColor : 'bg-[var(--card-bg)]'}
                style={{
                  height: heightPerc,
                  width: '100%',
                  border: '2px solid var(--border-color)',
                  opacity: activeDate && activeDate !== date ? 0.3 : 1,
                  transform: activeDate === date ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                  transformOrigin: 'bottom center',
                  transition: 'all 0.1s ease-in-out',
                  zIndex: activeDate === date ? 10 : 1
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ minHeight: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
        {activeDate ? (
          <span>
            {activeDate.split('-')[2]}/{activeDate.split('-')[1]}: <span className="px-1 bg-[var(--border-color)] text-[var(--bg-color)]">{activeCount}</span> task{activeCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span style={{ opacity: 0.5 }}>Hover or tap a bar for details</span>
        )}
      </div>
    </div>
  );
}

export default function StatsView({ dailyStats, onBack }: StatsViewProps) {
  const days = getLast30Days();
  
  // Calculate 7-day MVP
  const last7Days = days.slice(-7);
  let most7DayCount = 0;
  let fern7DayCount = 0;
  
  last7Days.forEach(d => {
    const s = dailyStats[d];
    if (s) {
      most7DayCount += s.mostCount;
      fern7DayCount += s.fernCount;
    }
  });

  let mvpText = '';
  let mvpSubtitle = '';
  if (most7DayCount === 0 && fern7DayCount === 0) {
    mvpText = "IT'S A TIE. WORK HARDER.";
    mvpSubtitle = '0 TASKS COMPLETED THIS WEEK';
  } else if (most7DayCount > fern7DayCount) {
    mvpText = 'CURRENT MVP: MOST 🏆';
    mvpSubtitle = `SCORE: ${most7DayCount} TO ${fern7DayCount}`;
  } else if (fern7DayCount > most7DayCount) {
    mvpText = 'CURRENT MVP: FERN 🏆';
    mvpSubtitle = `SCORE: ${fern7DayCount} TO ${most7DayCount}`;
  } else {
    mvpText = "IT'S A TIE. WORK HARDER.";
    mvpSubtitle = `NECK AND NECK AT ${most7DayCount} TASKS EACH`;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <button
        onClick={onBack}
        className="rb-btn-secondary"
        style={{ marginBottom: '1.5rem', fontSize: '0.875rem', letterSpacing: '0.1em' }}
      >
        &lt; BACK TO LIST
      </button>

      {/* MVP Banner */}
      <div style={{
        border: '4px solid var(--border-color)',
        padding: '1.5rem 1rem',
        marginBottom: '2rem',
        textAlign: 'center',
        background: 'var(--border-color)',
        color: 'var(--bg-color)',
        textTransform: 'uppercase',
      }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          {mvpText}
        </div>
        <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
          {mvpSubtitle}
        </div>
      </div>

      <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '1.25rem', margin: '0 0 1.5rem 0', letterSpacing: '-0.01em' }}>
        ACTIVITY LOG — LAST 30 DAYS
      </h1>

      <HeatmapGrid user="most" days={days} stats={dailyStats} />
      <hr className="rb-divider" style={{ marginBottom: '1.5rem' }} />
      <HeatmapGrid user="fern" days={days} stats={dailyStats} />
    </div>
  );
}

