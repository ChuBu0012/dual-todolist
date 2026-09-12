import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTodoStore } from './todoStore';
import { firestoreService } from '../services/firestoreService';
import { useAuthStore } from './authStore';

// Mock dependencies
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    subscribeCards: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reorderCards: vi.fn(),
    recordCompletedTask: vi.fn().mockResolvedValue('doc-1'),
    removeCompletedTask: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('TodoStore (Cards)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTodoStore.setState({
      cards: [],
      isLoading: false,
      error: null,
    });
    useAuthStore.setState({ currentUser: 'most' });
  });

  describe('initialize', () => {
    it('should call subscribeCards and return unsubscribe', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(firestoreService.subscribeCards).mockReturnValue(mockUnsubscribe);

      const { initialize } = useTodoStore.getState();
      const unsubscribe = initialize();

      expect(firestoreService.subscribeCards).toHaveBeenCalled();
      expect(useTodoStore.getState().isLoading).toBe(true);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('createCard', () => {
    it('should call firestoreService.createCard', async () => {
      const { createCard } = useTodoStore.getState();
      await createCard({ title: 'New card', assignee: 'both', items: [] });

      expect(firestoreService.createCard).toHaveBeenCalledWith({
        title: 'New card',
        assignee: 'both',
        items: [],
      });
    });

    it('should set error on failure', async () => {
      vi.mocked(firestoreService.createCard).mockRejectedValueOnce(new Error('Network error'));
      const { createCard } = useTodoStore.getState();
      await expect(createCard({ title: 'Fail', assignee: 'most' })).rejects.toThrow('Network error');
      expect(useTodoStore.getState().error).toBe('Network error');
    });
  });

  describe('toggleChecklistItem', () => {
    it('should mark item complete and record completed task in firestore', async () => {
      useTodoStore.setState({
        cards: [
          {
            id: 'card-1',
            title: 'Test Card',
            assignee: 'most',
            isPinned: false,
            order: 0,
            items: [{ id: 'item-1', text: 'Task 1', isDone: false }],
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
          },
        ],
      });

      const { toggleChecklistItem } = useTodoStore.getState();
      await toggleChecklistItem('card-1', 'item-1', true);

      // Check local optimistic update
      const updatedCard = useTodoStore.getState().cards[0];
      expect(updatedCard.items[0].isDone).toBe(true);
      expect(updatedCard.items[0].completedBy).toBe('most');

      // Check firestore update
      expect(firestoreService.updateCard).toHaveBeenCalledWith('card-1', {
        items: [
          expect.objectContaining({
            id: 'item-1',
            isDone: true,
            completedBy: 'most',
          }),
        ],
      });

      // Check firestore completed task log
      expect(firestoreService.recordCompletedTask).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: 'card-1',
          itemId: 'item-1',
          itemText: 'Task 1',
          completedBy: 'most',
        })
      );
    });

    it('should remove completed task log if unchecking an item', async () => {
      useTodoStore.setState({
        cards: [
          {
            id: 'card-1',
            title: 'Test Card',
            assignee: 'most',
            isPinned: false,
            order: 0,
            items: [{ id: 'item-1', text: 'Task 1', isDone: true, completedBy: 'most' }],
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
          },
        ],
      });

      const { toggleChecklistItem } = useTodoStore.getState();
      await toggleChecklistItem('card-1', 'item-1', false);

      expect(firestoreService.removeCompletedTask).toHaveBeenCalledWith('card-1', 'item-1');
    });
  });

  describe('reorderCards', () => {
    it('should optimistically reorder locally and persist', async () => {
      useTodoStore.setState({
        cards: [
          { id: 'a', title: 'A', order: 0 } as any,
          { id: 'b', title: 'B', order: 1 } as any,
          { id: 'c', title: 'C', order: 2 } as any,
        ],
      });

      const { reorderCards } = useTodoStore.getState();
      await reorderCards(['c', 'a', 'b']);

      expect(firestoreService.reorderCards).toHaveBeenCalledWith(['c', 'a', 'b']);

      const ordered = useTodoStore.getState().cards.map((c) => c.id);
      expect(ordered).toEqual(['c', 'a', 'b']);
    });
  });
});
