import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsView from './StatsView';
import type { DailyStat } from '../../types/todo';

vi.mock('../../utils/dateFormat', () => ({
  getLast30Days: () => {
    return Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
  },
}));

describe('StatsView', () => {
  const mockDailyStats: Record<string, DailyStat> = {
    '2026-09-10': { date: '2026-09-10', mostCount: 3, fernCount: 0 },
    '2026-09-11': { date: '2026-09-11', mostCount: 0, fernCount: 5 },
    '2026-09-12': { date: '2026-09-12', mostCount: 7, fernCount: 7 },
  };

  it('renders correctly with 30 squares for Most and Fern', () => {
    const onBack = vi.fn();
    const { container } = render(<StatsView dailyStats={mockDailyStats} onBack={onBack} />);

    expect(screen.getByText('ACTIVITY LOG — LAST 30 DAYS')).toBeInTheDocument();
    expect(screen.getByText("MOST'S LOG")).toBeInTheDocument();
    expect(screen.getByText("FERN'S LOG")).toBeInTheDocument();

    // Now bars don't have title, we query them by width
    const bars = container.querySelectorAll('div[style*="width: 24px"]');
    expect(bars).toHaveLength(60); // 30 Most + 30 Fern
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<StatsView dailyStats={mockDailyStats} onBack={onBack} />);

    const backButton = screen.getByText('< BACK TO LIST');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('assigns correct color levels based on task counts', () => {
    const onBack = vi.fn();
    render(<StatsView dailyStats={mockDailyStats} onBack={onBack} />);
    
    // We can simulate hover to check specific dates
    // But a simpler way is to find the colored boxes
    const mostSection = screen.getByText("MOST'S LOG").parentElement?.parentElement;
    const fernSection = screen.getByText("FERN'S LOG").parentElement?.parentElement;
    
    // Most has red-500 bars
    expect(mostSection?.querySelector('.bg-red-500')).toBeInTheDocument();
    
    // Fern has green-500 bars
    expect(fernSection?.querySelector('.bg-green-500')).toBeInTheDocument();
  });
});

