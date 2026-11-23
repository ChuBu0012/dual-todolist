import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CardModal } from './CardModal';
import { useTodoStore } from '../../store/todoStore';
import type { CardItem } from '../../types/todo';

// Mock dnd-kit hooks since they require context to run properly
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: any) => children,
  verticalListSortingStrategy: {},
  arrayMove: vi.fn(),
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => children,
  closestCorners: vi.fn(),
  MouseSensor: {},
  TouchSensor: {},
  useSensor: vi.fn(),
  useSensors: vi.fn().mockReturnValue([]),
}));

const mockUpdateField = vi.fn();

vi.mock('../../hooks/useDebouncedCardSync', () => ({
  useDebouncedCardSync: (initial: any) => ({
    localCard: initial || { title: '', items: [], assignee: 'both', isPinned: false, isArchived: false },
    updateField: mockUpdateField,
    syncState: 'SAVED',
    flush: vi.fn(),
  }),
}));

describe('CardModal', () => {
  const mockCard: CardItem = {
    id: 'card-1',
    title: 'Test Card',
    isPinned: false,
    order: 0,
    assignee: 'most',
    items: [{ id: 'item-1', text: 'Task 1', isDone: false }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let deleteCardMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    deleteCardMock = vi.fn().mockResolvedValue(undefined);
    useTodoStore.setState({
      cards: [mockCard],
      deleteCard: deleteCardMock as any,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should call onClose on single click of close button', () => {
    const onClose = vi.fn();
    render(<CardModal card={mockCard} onClose={onClose} />);

    const closeBtn = screen.getByTitle('Click to close, hold to delete');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('should open delete confirmation modal when long pressing close button', () => {
    render(<CardModal card={mockCard} onClose={vi.fn()} />);

    const closeBtn = screen.getByTitle('Click to close, hold to delete');

    // Simulate pointer down
    fireEvent.pointerDown(closeBtn, { clientX: 100, clientY: 100 });

    // Advance 550ms
    act(() => {
      vi.advanceTimersByTime(550);
    });

    // Confirmation modal should be visible
    expect(screen.getByText('DELETE CARD?')).toBeInTheDocument();
    expect(
      screen.getByText('This card and all its items will be permanently removed.')
    ).toBeInTheDocument();
  });

  it('should delete card and close modal when confirming delete', async () => {
    const onClose = vi.fn();
    render(<CardModal card={mockCard} onClose={onClose} />);

    const closeBtn = screen.getByTitle('Click to close, hold to delete');
    fireEvent.pointerDown(closeBtn, { clientX: 100, clientY: 100 });

    act(() => {
      vi.advanceTimersByTime(550);
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: 'DELETE' });
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    expect(deleteCardMock).toHaveBeenCalledWith('card-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('should cancel delete when clicking cancel button', () => {
    render(<CardModal card={mockCard} onClose={vi.fn()} />);

    const closeBtn = screen.getByTitle('Click to close, hold to delete');
    fireEvent.pointerDown(closeBtn, { clientX: 100, clientY: 100 });

    act(() => {
      vi.advanceTimersByTime(550);
    });

    const cancelBtn = screen.getByRole('button', { name: 'CANCEL' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('DELETE CARD?')).not.toBeInTheDocument();
    expect(deleteCardMock).not.toHaveBeenCalled();
  });

  it('should toggle archive state when clicking archive button', () => {
    render(<CardModal card={mockCard} onClose={vi.fn()} />);

    const archiveBtn = screen.getByTitle('Archive card');
    fireEvent.click(archiveBtn);

    expect(mockUpdateField).toHaveBeenCalledWith({
      isArchived: true,
      archivedAt: expect.any(String),
      isPinned: false,
    });
  });

  it('should show ARCHIVED badge and unarchive title when card is archived', () => {
    const archivedCard: CardItem = {
      ...mockCard,
      isArchived: true,
      archivedAt: '2026-11-23T12:00:00.000Z',
    };

    render(<CardModal card={archivedCard} onClose={vi.fn()} />);

    expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
    const unarchiveBtn = screen.getByTitle('Unarchive card');
    fireEvent.click(unarchiveBtn);

    expect(mockUpdateField).toHaveBeenCalledWith({
      isArchived: false,
      archivedAt: null,
      isPinned: false,
    });
  });
});
