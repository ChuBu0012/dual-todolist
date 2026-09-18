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
