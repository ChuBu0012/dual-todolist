import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MainLayout } from './MainLayout';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../store/todoStore', () => ({
  useTodoStore: vi.fn(),
}));

vi.mock('../todo/TodoList', () => ({
  TodoList: () => <div data-testid="todo-list">Todo List Content</div>,
}));

vi.mock('../todo/SyncStatusIcon', () => ({
  SyncStatusIcon: () => <div data-testid="sync-icon">Sync Icon</div>,
}));

describe('MainLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockImplementation((selector: any) =>
      selector({ currentUser: 'most', logout: vi.fn() })
    );
    (useTodoStore as any).mockImplementation((selector: any) =>
      selector({ initialize: () => vi.fn(), syncState: 'IDLE' })
    );
  });

  it('renders DUAL TODO logo and children', () => {
    render(<MainLayout><div>Child Content</div></MainLayout>);
    expect(screen.getByText('DUAL TODO')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('calls onLogoClick when logo is clicked normally', () => {
    const onLogoClick = vi.fn();
    render(<MainLayout onLogoClick={onLogoClick} />);

    const logo = screen.getByText('DUAL TODO');
    fireEvent.pointerDown(logo, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(logo);
    fireEvent.click(logo);

    expect(onLogoClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onLogoLongPress and suppresses onLogoClick when held for 500ms', () => {
    vi.useFakeTimers();
    const onLogoClick = vi.fn();
    const onLogoLongPress = vi.fn();

    render(<MainLayout onLogoClick={onLogoClick} onLogoLongPress={onLogoLongPress} />);

    const logo = screen.getByText('DUAL TODO');
    fireEvent.pointerDown(logo, { clientX: 100, clientY: 100 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLogoLongPress).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(logo);
    fireEvent.click(logo);

    expect(onLogoClick).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancels long press if pointer moves significantly', () => {
    vi.useFakeTimers();
    const onLogoLongPress = vi.fn();

    render(<MainLayout onLogoLongPress={onLogoLongPress} />);

    const logo = screen.getByText('DUAL TODO');
    fireEvent.pointerDown(logo, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(logo, { clientX: 150, clientY: 150 }); // moved > 10px

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLogoLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
