import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import db from '../config/firebase';
import type { CardItem, DailySummary, TodoAssignee, ChecklistItem, CompletedTaskLog } from '../types/todo';
import { formatThaiDate } from '../utils/dateFormat';

const TODOS_COLLECTION = 'todos';
const SUMMARIES_COLLECTION = 'dailySummaries';
const COMPLETED_TASKS_COLLECTION = 'completedTasks';

export interface CreateCardInput {
  title: string;
  isPinned?: boolean;
  assignee: TodoAssignee;
  items?: ChecklistItem[];
}

export type UpdateCardInput = Partial<Omit<CardItem, 'id' | 'createdAt'>>;

export const firestoreService = {
  /**
   * Create a new card at top of list (order = 0, shift others down)
   */
  async createCard(input: CreateCardInput): Promise<string> {
    console.log('[DEBUG-7f3a] firestoreService.createCard called with input:', input);
    const todosRef = collection(db, TODOS_COLLECTION);
    const newDocRef = doc(todosRef);
    const now = new Date().toISOString();

    try {
      console.log('[DEBUG-7f3a] Fetching existing cards to determine order...');
      const snapshot = await getDocs(query(todosRef, orderBy('order', 'asc')));
      console.log('[DEBUG-7f3a] Fetched existing cards count:', snapshot.docs.length);

      // Determine top order: smaller than lowest order so it appears at top
      let topOrder = 0;
      if (!snapshot.empty) {
        const firstDocOrder = snapshot.docs[0].data().order;
        topOrder = typeof firstDocOrder === 'number' ? firstDocOrder - 1 : 0;
      }

      const cardData: Omit<CardItem, 'id'> = {
        title: input.title.trim(),
        isPinned: input.isPinned ?? false,
        assignee: input.assignee,
        order: topOrder,
        items: input.items || [],
        createdAt: now,
        updatedAt: now,
      };

      console.log('[DEBUG-7f3a] Writing new doc with setDoc:', newDocRef.id, cardData);
      await setDoc(newDocRef, cardData);
      console.log('[DEBUG-7f3a] Card created successfully with ID:', newDocRef.id);

      return newDocRef.id;
    } catch (error) {
      console.error('[DEBUG-7f3a] Error in firestoreService.createCard:', error);
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        console.error('[DEBUG-7f3a] Error details:', {
          code: err.code,
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      }
      throw error;
    }
  },

  /**
   * Update an existing card
   */
  async updateCard(id: string, input: UpdateCardInput): Promise<void> {
    console.log('[DEBUG-7f3a] firestoreService.updateCard called for id:', id, 'input:', input);
    const docRef = doc(db, TODOS_COLLECTION, id);
    const updateData = Object.fromEntries(
      Object.entries({ ...input, updatedAt: new Date().toISOString() })
        .filter(([_, value]) => value !== undefined)
    );

    try {
      await updateDoc(docRef, updateData);
      console.log('[DEBUG-7f3a] firestoreService.updateCard success for id:', id);
    } catch (error) {
      console.error('[DEBUG-7f3a] Error in firestoreService.updateCard:', error);
      throw error;
    }
  },

  /**
   * Reorder cards after drag: persist new order values in a single batch
   */
  async reorderCards(orderedIds: string[]): Promise<void> {
    console.log('[DEBUG-7f3a] firestoreService.reorderCards called with ids:', orderedIds);
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      const docRef = doc(db, TODOS_COLLECTION, id);
      batch.update(docRef, { order: index, updatedAt: new Date().toISOString() });
    });
    try {
      await batch.commit();
      console.log('[DEBUG-7f3a] firestoreService.reorderCards committed successfully');
    } catch (error) {
      console.error('[DEBUG-7f3a] Error in firestoreService.reorderCards:', error);
      throw error;
    }
  },

  /**
   * Delete a card
   */
  async deleteCard(id: string): Promise<void> {
    console.log('[DEBUG-7f3a] firestoreService.deleteCard called for id:', id);
    const docRef = doc(db, TODOS_COLLECTION, id);
    try {
      await deleteDoc(docRef);
      console.log('[DEBUG-7f3a] firestoreService.deleteCard success for id:', id);
    } catch (error) {
      console.error('[DEBUG-7f3a] Error in firestoreService.deleteCard:', error);
      throw error;
    }
  },

  /**
   * Real-time subscription for cards collection (ordered by order field)
   */
  subscribeCards(
    onUpdate: (cards: CardItem[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    console.log('[DEBUG-7f3a] Subscribing to cards collection...');
    const todosRef = collection(db, TODOS_COLLECTION);
    const q = query(todosRef, orderBy('order', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        console.log('[DEBUG-7f3a] Firestore snapshot received. Docs count:', snapshot.docs.length);
        const cards: CardItem[] = [];
        snapshot.forEach((docSnapshot) => {
          cards.push({
            id: docSnapshot.id,
            ...(docSnapshot.data() as Omit<CardItem, 'id'>),
          });
        });
        onUpdate(cards);
      },
      (error) => {
        console.error('[DEBUG-7f3a] Firestore subscription error:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Save daily summary
   */
  async saveDailySummary(summary: DailySummary): Promise<void> {
    const docRef = doc(db, SUMMARIES_COLLECTION, summary.date);
    await setDoc(docRef, summary);
  },

  /**
   * Get daily summary for a specific date
   */
  async getDailySummary(date: string): Promise<DailySummary | null> {
    const docRef = doc(db, SUMMARIES_COLLECTION, date);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as DailySummary;
  },

  /**
   * Record a completed task log in Firestore collection 'completedTasks'
   * Used for 30-minute interval Discord batch updates
   */
  async recordCompletedTask(task: Omit<CompletedTaskLog, 'id' | 'notified' | 'dateStr'>): Promise<string> {
    const docId = `${task.cardId}_${task.itemId}`;
    const docRef = doc(db, COMPLETED_TASKS_COLLECTION, docId);
    const dateStr = formatThaiDate(new Date(task.completedAt));

    const logData: Omit<CompletedTaskLog, 'id'> = {
      ...task,
      dateStr,
      notified: false,
    };

    console.log('[DEBUG-7f3a] Recording completed task log:', docId, logData);
    await setDoc(docRef, logData);
    return docId;
  },

  /**
   * Remove a completed task log if user unchecks an item before it is notified
   */
  async removeCompletedTask(cardId: string, itemId: string): Promise<void> {
    const docId = `${cardId}_${itemId}`;
    const docRef = doc(db, COMPLETED_TASKS_COLLECTION, docId);
    console.log('[DEBUG-7f3a] Removing completed task log:', docId);
    await deleteDoc(docRef);
  },

  /**
   * Fetch unnotified completed tasks for the 30-minute cron
   */
  async getUnnotifiedCompletedTasks(): Promise<CompletedTaskLog[]> {
    const colRef = collection(db, COMPLETED_TASKS_COLLECTION);
    const q = query(colRef, where('notified', '==', false));
    const snap = await getDocs(q);
    const results: CompletedTaskLog[] = [];
    snap.forEach((d) => {
      results.push({
        id: d.id,
        ...(d.data() as Omit<CompletedTaskLog, 'id'>),
      });
    });
    return results;
  },

  /**
   * Mark completed tasks as notified after sending to Discord
   */
  async markCompletedTasksAsNotified(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const docRef = doc(db, COMPLETED_TASKS_COLLECTION, id);
      batch.update(docRef, { notified: true, notifiedAt: now });
    });
    await batch.commit();
  },

  /**
   * Fetch all active cards (used for daily summary calculation)
   */
  async getAllCards(): Promise<CardItem[]> {
    const todosRef = collection(db, TODOS_COLLECTION);
    const q = query(todosRef, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const cards: CardItem[] = [];
    snap.forEach((d) => {
      cards.push({
        id: d.id,
        ...(d.data() as Omit<CardItem, 'id'>),
      });
    });
    return cards;
  },
};
