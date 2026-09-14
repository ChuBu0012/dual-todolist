import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDoc, getDocs, writeBatch, } from 'firebase/firestore';
import db from '../config/firebase';
import { formatThaiDate } from '../utils/dateFormat';
const TODOS_COLLECTION = 'todos';
const SUMMARIES_COLLECTION = 'dailySummaries';
export const firestoreService = {
    /**
     * Create a new card at top of list (order = 0, shift others down)
     */
    async createCard(input) {
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
            const cardData = {
                title: (input.title || '').trim() || formatThaiDate(new Date()),
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
        }
        catch (error) {
            console.error('[DEBUG-7f3a] Error in firestoreService.createCard:', error);
            if (error && typeof error === 'object') {
                const err = error;
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
    async updateCard(id, input) {
        const docRef = doc(db, TODOS_COLLECTION, id);
        const normalizedInput = { ...input };
        if (normalizedInput.title !== undefined) {
            normalizedInput.title = normalizedInput.title.trim() || formatThaiDate(new Date());
        }
        const updateData = Object.fromEntries(Object.entries({ ...normalizedInput, updatedAt: new Date().toISOString() })
            .filter(([, value]) => value !== undefined));
        try {
            await updateDoc(docRef, updateData);
            console.log('[DEBUG-7f3a] firestoreService.updateCard success for id:', id);
        }
        catch (error) {
            console.error('[DEBUG-7f3a] Error in firestoreService.updateCard:', error);
            throw error;
        }
    },
    /**
     * Reorder cards after drag: persist new order values in a single batch
     */
    async reorderCards(orderedIds) {
        console.log('[DEBUG-7f3a] firestoreService.reorderCards called with ids:', orderedIds);
        const batch = writeBatch(db);
        orderedIds.forEach((id, index) => {
            const docRef = doc(db, TODOS_COLLECTION, id);
            batch.update(docRef, { order: index, updatedAt: new Date().toISOString() });
        });
        try {
            await batch.commit();
            console.log('[DEBUG-7f3a] firestoreService.reorderCards committed successfully');
        }
        catch (error) {
            console.error('[DEBUG-7f3a] Error in firestoreService.reorderCards:', error);
            throw error;
        }
    },
    /**
     * Delete a card
     */
    async deleteCard(id) {
        console.log('[DEBUG-7f3a] firestoreService.deleteCard called for id:', id);
        const docRef = doc(db, TODOS_COLLECTION, id);
        try {
            await deleteDoc(docRef);
            console.log('[DEBUG-7f3a] firestoreService.deleteCard success for id:', id);
        }
        catch (error) {
            console.error('[DEBUG-7f3a] Error in firestoreService.deleteCard:', error);
            throw error;
        }
    },
    /**
     * Real-time subscription for cards collection (ordered by order field)
     */
    subscribeCards(onUpdate, onError) {
        console.log('[DEBUG-7f3a] Subscribing to cards collection...');
        const todosRef = collection(db, TODOS_COLLECTION);
        const q = query(todosRef, orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
            console.log('[DEBUG-7f3a] Firestore snapshot received. Docs count:', snapshot.docs.length);
            const cards = [];
            snapshot.forEach((docSnapshot) => {
                cards.push({
                    id: docSnapshot.id,
                    ...docSnapshot.data(),
                });
            });
            onUpdate(cards);
        }, (error) => {
            console.error('[DEBUG-7f3a] Firestore subscription error:', error);
            if (onError)
                onError(error);
        });
    },
    /**
     * Save daily summary
     */
    async saveDailySummary(summary) {
        const docRef = doc(db, SUMMARIES_COLLECTION, summary.date);
        await setDoc(docRef, summary);
    },
    /**
     * Get daily summary for a specific date
     */
    async getDailySummary(date) {
        const docRef = doc(db, SUMMARIES_COLLECTION, date);
        const snap = await getDoc(docRef);
        if (!snap.exists())
            return null;
        return snap.data();
    },
    /**
     * Fetch all active cards (used for daily summary calculation)
     */
    async getAllCards() {
        const todosRef = collection(db, TODOS_COLLECTION);
        const q = query(todosRef, orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const cards = [];
        snap.forEach((d) => {
            cards.push({
                id: d.id,
                ...d.data(),
            });
        });
        return cards;
    },
};
