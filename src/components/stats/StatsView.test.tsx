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

    // Now squares don't have title, we query them by border style or width
    const squares = container.querySelectorAll('div[style*="width: 20px"]');
    expect(squares).toHaveLength(60); // 30 Most + 30 Fern
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
    
    // Most has 3 on 10th (red-400), 0 on 11th, 7 on 12th (red-600)
    expect(mostSection?.querySelector('.bg-red-400')).toBeInTheDocument();
    expect(mostSection?.querySelector('.bg-red-600')).toBeInTheDocument();
    
    // Fern has 0 on 10th, 5 on 11th (green-400), 7 on 12th (green-600)
    expect(fernSection?.querySelector('.bg-green-400')).toBeInTheDocument();
    expect(fernSection?.querySelector('.bg-green-600')).toBeInTheDocument();
  });
});

