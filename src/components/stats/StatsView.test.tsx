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

    const mostSquares = container.querySelectorAll('div[title$=" tasks"]');
    // We expect 30 for most and 30 for fern, but they might just match title
    // Actually the title includes the task count, so we can check total squares.
    expect(mostSquares).toHaveLength(60);
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
    const { container } = render(<StatsView dailyStats={mockDailyStats} onBack={onBack} />);

    // Check for specific days and counts
    // 2026-09-10 Most: 3 (bg-red-400), Fern: 0 (bg-white)
    const mostSquare3 = container.querySelector('div[title="10/09: 3 tasks"]');
    expect(mostSquare3).toHaveClass('bg-red-400');

    // 2026-09-11 Fern: 5 (bg-green-400)
    const fernSquare5 = container.querySelector('div[title="11/09: 5 tasks"]');
    expect(fernSquare5).toHaveClass('bg-green-400');

    // 2026-09-12 Most: 7 (bg-red-600), Fern: 7 (bg-green-600)
    const mostSquare7 = container.querySelectorAll('div[title="12/09: 7 tasks"]');
    expect(mostSquare7[0]).toHaveClass('bg-red-600');
    expect(mostSquare7[1]).toHaveClass('bg-green-600');
  });
});
