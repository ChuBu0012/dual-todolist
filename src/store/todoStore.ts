import { create } from 'zustand';
import { firestoreService, type CreateCardInput, type UpdateCardInput } from '../services/firestoreService';
import { discordService } from '../services/discordService';
import type { CardItem } from '../types/todo';
import { useAuthStore } from './authStore';

export type SyncState = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

let savedTimer: ReturnType<typeof setTimeout> | null = null;
const pendingDiscordTimeouts = new Map<string, NodeJS.Timeout>();

interface TodoState {
  cards: CardItem[];
  isLoading: boolean;
  syncState: SyncState;
  error: string | null;
  pendingNotifications: string[];

  // Actions
  initialize: () => () => void;
  setSyncState: (syncState: SyncState) => void;
  createCard: (input: CreateCardInput) => Promise<string>;
  updateCard: (id: string, input: UpdateCardInput) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reorderCards: (orderedIds: string[]) => Promise<void>;

  // Checklist Item Actions
  toggleChecklistItem: (cardId: string, itemId: string, isDone: boolean) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  cards: [],
  isLoading: true,
  syncState: 'IDLE',
  error: null,
  pendingNotifications: [],

  setSyncState: (syncState: SyncState) => {
    if (savedTimer) {
      clearTimeout(savedTimer);
      savedTimer = null;
    }
    set({ syncState });
    if (syncState === 'SAVED') {
      savedTimer = setTimeout(() => {
        if (get().syncState === 'SAVED') {
          set({ syncState: 'IDLE' });
        }
      }, 2500);
    }
  },

  initialize: () => {
    console.log('[DEBUG-7f3a] todoStore.initialize called');
    set({ isLoading: true, error: null });
    const unsubscribeCards = firestoreService.subscribeCards(
      (cards) => {
        console.log('[DEBUG-7f3a] todoStore updated with cards:', cards.length);
        set({ cards, isLoading: false });
      },
      (error) => {
        console.error('[DEBUG-7f3a] todoStore subscribeCards error:', error);
        set({ error: error.message, isLoading: false });
      }
    );
    return () => { unsubscribeCards(); };
  },

  createCard: async (input) => {
    console.log('[DEBUG-7f3a] todoStore.createCard called with:', input);
    get().setSyncState('SAVING');
    try {
      const id = await firestoreService.createCard(input);
      console.log('[DEBUG-7f3a] todoStore.createCard successfully completed');
      get().setSyncState('SAVED');
      return id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create card';
      console.error('[DEBUG-7f3a] todoStore.createCard error caught:', message, error);
      get().setSyncState('ERROR');
      set({ error: message });
      throw error;
    }
  },

  updateCard: async (id, input) => {
    console.log('[DEBUG-7f3a] todoStore.updateCard called for:', id, input);
    get().setSyncState('SAVING');
    try {
      await firestoreService.updateCard(id, input);
      console.log('[DEBUG-7f3a] todoStore.updateCard successfully completed');
      get().setSyncState('SAVED');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update card';
      console.error('[DEBUG-7f3a] todoStore.updateCard error caught:', message, error);
      get().setSyncState('ERROR');
      set({ error: message });
      throw error;
    }
  },

  deleteCard: async (id) => {
    console.log('[DEBUG-7f3a] todoStore.deleteCard called for:', id);
    get().setSyncState('SAVING');
    try {
      await firestoreService.deleteCard(id);
      console.log('[DEBUG-7f3a] todoStore.deleteCard successfully completed');
      get().setSyncState('SAVED');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete card';
      console.error('[DEBUG-7f3a] todoStore.deleteCard error caught:', message, error);
      get().setSyncState('ERROR');
      set({ error: message });
      throw error;
    }
  },

  reorderCards: async (orderedIds) => {
    console.log('[DEBUG-7f3a] todoStore.reorderCards called with:', orderedIds);
    // Optimistic update: reorder locally first with O(N) map
    const { cards } = get();
    const cardMap = new Map(cards.map((c) => [c.id, c]));

    const reordered: CardItem[] = [];
    const missing: CardItem[] = []; // cards not in orderedIds

    orderedIds.forEach((id, index) => {
      const item = cardMap.get(id);
      if (item) {
        reordered.push({ ...item, order: index });
        cardMap.delete(id);
      }
    });

    // Append any missing cards at the end just in case
    cardMap.forEach((item) => {
      missing.push(item);
    });

    set({ cards: [...reordered, ...missing] });
    get().setSyncState('SAVING');

    try {
      await firestoreService.reorderCards(orderedIds);
      get().setSyncState('SAVED');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reorder cards';
      console.error('[DEBUG-7f3a] todoStore.reorderCards error:', message, error);
      get().setSyncState('ERROR');
      set({ error: message });
    }
  },

  toggleChecklistItem: async (cardId, itemId, isDone) => {
    console.log('[DEBUG-7f3a] todoStore.toggleChecklistItem called:', { cardId, itemId, isDone });
    const { cards } = get();
    const card = cards.find((c) => c.id === cardId);
    const currentUser = useAuthStore.getState().currentUser;

    if (!card || !currentUser) {
      console.warn('[DEBUG-7f3a] Card or currentUser not found:', { card: !!card, currentUser });
      return;
    }

    const itemIndex = card.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      console.warn('[DEBUG-7f3a] Item index not found for id:', itemId);
      return;
    }

    const updatedItems = [...card.items];
    const itemToUpdate = updatedItems[itemIndex];
    
    updatedItems[itemIndex] = {
      ...itemToUpdate,
      isDone,
      completedBy: isDone ? currentUser : null,
      completedAt: isDone ? new Date().toISOString() : null,
    };

    // Optimistic UI
    const currentPending = new Set(get().pendingNotifications);
    if (isDone && !itemToUpdate.isDone) {
      currentPending.add(itemId);
    } else {
      currentPending.delete(itemId);
    }

    set({
      cards: cards.map(c => c.id === cardId ? { ...c, items: updatedItems } : c),
      pendingNotifications: Array.from(currentPending),
    });
    get().setSyncState('SAVING');

    // Handle Discord Notification Delay
    if (isDone && !itemToUpdate.isDone) {
      if (pendingDiscordTimeouts.has(itemId)) {
        clearTimeout(pendingDiscordTimeouts.get(itemId));
      }
      
      const timer = setTimeout(async () => {
        try {
          await discordService.sendTaskCompleted(card.title, itemToUpdate.text, currentUser);
        } catch (e) {
          console.error('Failed to send discord message', e);
        } finally {
          const nowPending = new Set(useTodoStore.getState().pendingNotifications);
          nowPending.delete(itemId);
          useTodoStore.setState({ pendingNotifications: Array.from(nowPending) });
          pendingDiscordTimeouts.delete(itemId);
        }
      }, 1500); // 1.5 seconds delay
      
      pendingDiscordTimeouts.set(itemId, timer);
    } else if (!isDone && itemToUpdate.isDone) {
      if (pendingDiscordTimeouts.has(itemId)) {
        clearTimeout(pendingDiscordTimeouts.get(itemId));
        pendingDiscordTimeouts.delete(itemId);
      }
    }

    try {
      await firestoreService.updateCard(cardId, { items: updatedItems });
      get().setSyncState('SAVED');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to toggle item';
      console.error('[DEBUG-7f3a] todoStore.toggleChecklistItem error:', message, error);
      get().setSyncState('ERROR');
      set({ error: message });
    }
  },
}));
