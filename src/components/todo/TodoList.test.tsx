import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoList } from './TodoList';
import { useTodoStore } from '../../store/todoStore';
import { useAuthStore } from '../../store/authStore';

// Mock dependencies
vi.mock('../../store/todoStore');
vi.mock('../../store/authStore');

// Mock ResizeObserver for dnd-kit
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('TodoList Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockUndoPaste = vi.fn();
    
    // Setup store mocks
    vi.mocked(useAuthStore).mockReturnValue('most'); // currentUser
    vi.mocked(useTodoStore).mockImplementation((selector: any) => {
      if (selector.toString().includes('cards')) return [];
      if (selector.toString().includes('isLoading')) return false;
      if (selector.toString().includes('error')) return null;
      if (selector.toString().includes('initialize')) return vi.fn();
      if (selector.toString().includes('reorderCards')) return vi.fn();
      return undefined;
    });

    useTodoStore.getState = vi.fn().mockReturnValue({
      undoPasteState: null,
      undoPaste: mockUndoPaste,
      updateCard: vi.fn(),
      createCard: vi.fn(),
    });
  });

  it('should call undoPaste when Cmd+Z is pressed and undoPasteState is not null', async () => {
    const mockUndoPaste = vi.fn();
    useTodoStore.getState = vi.fn().mockReturnValue({
      undoPasteState: { cardId: 'test', previousItems: [] },
      undoPaste: mockUndoPaste,
    });

    render(<TodoList />);

    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    
    await waitFor(() => {
      expect(mockUndoPaste).toHaveBeenCalled();
    });
  });

  it('should call undoPaste when Ctrl+Z is pressed and undoPasteState is not null', async () => {
    const mockUndoPaste = vi.fn();
    useTodoStore.getState = vi.fn().mockReturnValue({
      undoPasteState: { cardId: 'test', previousItems: [] },
      undoPaste: mockUndoPaste,
    });

    render(<TodoList />);

    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockUndoPaste).toHaveBeenCalled();
    });
  });

  it('should not call undoPaste when Cmd+Z is pressed but undoPasteState is null', async () => {
    const mockUndoPaste = vi.fn();
    useTodoStore.getState = vi.fn().mockReturnValue({
      undoPasteState: null,
      undoPaste: mockUndoPaste,
    });

    render(<TodoList />);

    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    
    await waitFor(() => {
      expect(mockUndoPaste).not.toHaveBeenCalled();
    });
  });
});

describe('TodoList Tags & Archive Filtering', () => {
  const mockCards: any[] = [
    {
      id: 'card-1',
      title: 'Dev Task #work',
      assignee: 'most',
      isPinned: false,
      isArchived: false,
      order: 0,
      items: [{ id: 'item-1', text: 'Build feature', isDone: false }],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'card-2',
      title: 'Groceries #home',
      assignee: 'fern',
      isPinned: false,
      isArchived: false,
      order: 1,
      items: [{ id: 'item-2', text: 'Buy milk', isDone: false }],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'card-3',
      title: 'Old sprint #work',
      assignee: 'most',
      isPinned: false,
      isArchived: true,
      archivedAt: '2026-11-20T00:00:00.000Z',
      order: 2,
      items: [{ id: 'item-3', text: 'Retro', isDone: true }],
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue('most');
    vi.mocked(useTodoStore).mockImplementation((selector: any) => {
      const fnStr = selector.toString();
      if (fnStr.includes('cards')) return mockCards;
      if (fnStr.includes('isLoading')) return false;
      if (fnStr.includes('error')) return null;
      if (fnStr.includes('initialize')) return vi.fn();
      if (fnStr.includes('reorderCards')) return vi.fn();
      if (fnStr.includes('pendingNotifications')) return [];
      return undefined;
    });

    useTodoStore.getState = vi.fn().mockReturnValue({
      cards: mockCards,
      undoPasteState: null,
      undoPaste: vi.fn(),
      updateCard: vi.fn(),
      createCard: vi.fn(),
      deleteCard: vi.fn(),
    });
  });

  it('should render tag filter chips from active cards', () => {
    const { getByText } = render(<TodoList />);
    expect(getByText('ALL (2)')).toBeInTheDocument();
    expect(getByText('#work (1)')).toBeInTheDocument();
    expect(getByText('#home (1)')).toBeInTheDocument();
  });

  it('should filter cards when clicking a tag chip', () => {
    const { getByText, queryByText } = render(<TodoList />);
    const workChip = getByText('#work (1)');
    fireEvent.click(workChip);

    expect(getByText('Dev Task #work')).toBeInTheDocument();
    expect(queryByText('Groceries #home')).not.toBeInTheDocument();
  });

  it('should render collapsible archived section and expand on click', () => {
    const { getByText, queryByText } = render(<TodoList />);
    expect(getByText(/ARCHIVED CARDS \(1\)/)).toBeInTheDocument();
    expect(queryByText('Old sprint #work')).not.toBeInTheDocument();

    const archiveBtn = getByText(/ARCHIVED CARDS \(1\)/);
    fireEvent.click(archiveBtn);

    expect(getByText('Old sprint #work')).toBeInTheDocument();
  });
});
