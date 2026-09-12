import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoCard } from './TodoCard';
import { useTodoStore } from '../../store/todoStore';
import type { CardItem } from '../../types/todo';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

describe('TodoCard Interactions', () => {
  const mockCard: CardItem = {
    id: 'card-1',
    title: 'Test Note',
    assignee: 'most',
    isPinned: true,
    order: 0,
    items: [
      { id: 'item-1', text: 'Item One', isDone: false },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useTodoStore.setState({
      cards: [mockCard],
      toggleChecklistItem: vi.fn(),
      updateCard: vi.fn(),
    });
  });

  it('should toggle item only when clicking checkbox square', async () => {
    const toggleSpy = vi.fn();
    useTodoStore.setState({ toggleChecklistItem: toggleSpy });

    render(<TodoCard card={mockCard} onClick={vi.fn()} />);

    // Click the checkbox container
    const checkbox = screen.getByTitle('Mark completed');
    await fireEvent.click(checkbox);

    expect(toggleSpy).toHaveBeenCalledWith('card-1', 'item-1', true);
  });

  it('should turn text into input on click and save on blur', async () => {
    const updateSpy = vi.fn().mockResolvedValue(undefined);
    useTodoStore.setState({ updateCard: updateSpy });
    const user = userEvent.setup();

    render(<TodoCard card={mockCard} onClick={vi.fn()} />);

    const itemText = screen.getByText('Item One');
    await user.click(itemText);

    // Input should now appear
    const input = screen.getByDisplayValue('Item One');
    expect(input).toBeInTheDocument();

    // Type new text and blur
    await user.clear(input);
    await user.type(input, 'Item One Edited');
    fireEvent.blur(input);

    expect(updateSpy).toHaveBeenCalledWith('card-1', {
      items: [{ id: 'item-1', text: 'Item One Edited', isDone: false }],
    });
  });

  it('should render PinIcon and not emoji', () => {
    render(<TodoCard card={mockCard} onClick={vi.fn()} />);
    expect(screen.queryByText('📌')).toBeNull();
    expect(screen.getByTitle('Pinned')).toBeInTheDocument();
  });
});

