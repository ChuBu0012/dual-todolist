import { useState, useEffect, useCallback, useRef } from 'react';
import { useTodoStore } from '../store/todoStore';
import type { CardItem } from '../types/todo';
import type { CreateCardInput, UpdateCardInput } from '../services/firestoreService';
import { formatThaiDate } from '../utils/dateFormat';

export type SyncState = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

export function useDebouncedCardSync(initialCard: CardItem | null) {
  const [localCard, setLocalCard] = useState<Partial<CardItem>>(
    initialCard || { title: '', items: [], assignee: 'both', isPinned: false }
  );
  const [syncState, setSyncState] = useState<SyncState>(initialCard ? 'SAVED' : 'IDLE');
  const createCard = useTodoStore((s) => s.createCard);
  const updateCard = useTodoStore((s) => s.updateCard);
  const deleteCard = useTodoStore((s) => s.deleteCard);
  
  const isDirtyRef = useRef(false);
  const localCardRef = useRef(localCard);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if this is a new card that has been created in Firestore yet
  const createdIdRef = useRef<string | null>(initialCard ? initialCard.id : null);

  // Sync ref with state
  useEffect(() => {
    localCardRef.current = localCard;
  }, [localCard]);

  const flush = useCallback(async () => {
    if (!isDirtyRef.current) return;
    
    const cardData = localCardRef.current;
    
    // Don't save empty ghost cards, and delete existing ones if emptied
    const hasTitle = (cardData.title || '').trim().length > 0;
    const hasItems = cardData.items && cardData.items.some(i => i.text.trim().length > 0);
    
    if (!hasTitle && !hasItems) {
      isDirtyRef.current = false;
      if (createdIdRef.current) {
        setSyncState('SAVING');
        try {
          await deleteCard(createdIdRef.current);
          createdIdRef.current = null; // Mark as deleted
          setSyncState('SAVED');
        } catch (err) {
          console.error('Failed to delete empty card:', err);
          setSyncState('ERROR');
          isDirtyRef.current = true;
        }
      }
      return;
    }

    setSyncState('SAVING');
    isDirtyRef.current = false; // Mark clean immediately to prevent double flush
    
    const effectiveTitle = hasTitle ? cardData.title!.trim() : formatThaiDate(new Date());

    try {
      if (!createdIdRef.current) {
        // Create
        const newId = await createCard({
          ...(cardData as CreateCardInput),
          title: effectiveTitle,
        });
        createdIdRef.current = newId;
      } else {
        // Update
        await updateCard(createdIdRef.current, {
          ...(cardData as UpdateCardInput),
          title: effectiveTitle,
        });
      }
      setSyncState('SAVED');
    } catch (err) {
      console.error('Failed to sync card:', err);
      setSyncState('ERROR');
      isDirtyRef.current = true; // Revert to dirty so it tries again
    }
  }, [createCard, updateCard, deleteCard]);

  // Debounce logic
  useEffect(() => {
    if (!isDirtyRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setSyncState('SAVING');
    
    timeoutRef.current = setTimeout(() => {
      flush();
    }, 800);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localCard, flush]);

  // Unmount & window close flush
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        flush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flush(); // Flush on unmount
    };
  }, [flush]);

  const updateField = useCallback((updates: Partial<CardItem>) => {
    setLocalCard(prev => ({ ...prev, ...updates }));
    isDirtyRef.current = true;
    useTodoStore.getState().setSyncState('SAVING');
  }, []);

  return {
    localCard,
    updateField,
    syncState,
    flush
  };
}
