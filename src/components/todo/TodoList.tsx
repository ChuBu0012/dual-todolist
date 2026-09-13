import { useState, useMemo } from 'react';
import { useTodoStore } from '../../store/todoStore';
import { useAuthStore } from '../../store/authStore';
import { TodoCard } from './TodoCard';
import { CardModal } from './CardModal';
import { PinIcon } from './PinIcon';
import type { CardItem } from '../../types/todo';
import {
  DndContext,
  closestCorners,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';



export function TodoList() {
  const cards = useTodoStore((s) => s.cards);
  const isLoading = useTodoStore((s) => s.isLoading);
  const reorderCards = useTodoStore((s) => s.reorderCards);
  
  const [selectedCard, setSelectedCard] = useState<{ card: CardItem | null, isReadOnly?: boolean } | undefined>(undefined);
  const currentUser = useAuthStore((s) => s.currentUser);

  const pinnedCards = useMemo(() => cards.filter(c => c.isPinned), [cards]);
  const otherCards = useMemo(() => cards.filter(c => !c.isPinned), [cards]);

  const sharedDates = useMemo(() => {
    const dates = new Set<string>();
    const byDateAndUser: Record<string, Set<string>> = {};
    
    cards.forEach(c => {
      const t = c.title.trim();
      if (!t) return;
      if (!byDateAndUser[t]) byDateAndUser[t] = new Set();
      
      if (c.assignee === 'most' || c.assignee === 'both') byDateAndUser[t].add('most');
      if (c.assignee === 'fern' || c.assignee === 'both') byDateAndUser[t].add('fern');
      
      if (byDateAndUser[t].has('most') && byDateAndUser[t].has('fern')) {
        dates.add(t);
      }
    });
    return dates;
  }, [cards]);

  const sensorOptions = useMemo(() => ({
    activationConstraint: { distance: 5 },
  }), []);

  const sensors = useSensors(
    useSensor(MouseSensor, sensorOptions),
    useSensor(TouchSensor, sensorOptions)
  );

  const handleCardClick = async (card: CardItem) => {
    // Check if locked by another user (and lock is less than 15 mins old)
    const lockAge = card.lockedAt ? Date.now() - new Date(card.lockedAt).getTime() : 0;
    const isLockedByOther = card.lockedBy && card.lockedBy !== currentUser && lockAge < 15 * 60000;

    if (isLockedByOther) {
      setSelectedCard({ card, isReadOnly: true });
    } else {
      // Acquire lock
      try {
        await useTodoStore.getState().updateCard(card.id, { 
          lockedBy: currentUser, 
          lockedAt: new Date().toISOString() 
        });
      } catch (e) {
        console.error('Failed to acquire lock', e);
      }
      setSelectedCard({ card, isReadOnly: false });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('DRAG_END', { active: active?.id, over: over?.id });
    if (!over || active.id === over.id) return;

    const activeCard = cards.find(c => c.id === active.id);
    const overCard = cards.find(c => c.id === over.id);

    if (!activeCard || !overCard) return;

    // If moving to a different list (pin/unpin)
    if (activeCard.isPinned !== overCard.isPinned) {
      // Update the pin status immediately in the store
      await useTodoStore.getState().updateCard(activeCard.id, { isPinned: overCard.isPinned });
      
      // After updating pin status, the lists will recompute and we can just rely on the natural order,
      // or we can explicitly reorder if needed. For now, letting it snap to the end of the new list is fine,
      // but to be precise we should reorder all IDs.
      // A full cross-list reorder is complex, so simply changing pin status is an easy win for users.
      return;
    }

    const list = activeCard.isPinned ? pinnedCards : otherCards;
    const oldIndex = list.findIndex(c => c.id === active.id);
    const newIndex = list.findIndex(c => c.id === over.id);

    const reorderedList = arrayMove(list, oldIndex, newIndex);
    
    let finalOrderedIds: string[];
    if (activeCard.isPinned) {
      finalOrderedIds = [...reorderedList.map(c => c.id), ...otherCards.map(c => c.id)];
    } else {
      finalOrderedIds = [...pinnedCards.map(c => c.id), ...reorderedList.map(c => c.id)];
    }

    reorderCards(finalOrderedIds);
  };

  if (isLoading) {
    return (
      <div className="text-center p-10 mono">
        LOADING...
      </div>
    );
  }

  return (
    <div className="pb-[96px] max-w-[840px] mx-auto w-full box-border">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
      
      {/* PINNED SECTION */}
      {pinnedCards.length > 0 && (
        <div className="mb-7">
          <h2 className="font-archivo-black text-[0.95rem] mb-3 uppercase tracking-wide flex items-center gap-1.5">
            <PinIcon isPinned size={14} /> Pinned
          </h2>
          <SortableContext items={pinnedCards.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 items-start">
              {pinnedCards.map((card) => (
                <TodoCard
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  isSharedDate={sharedDates.has(card.title.trim())}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}

      {/* OTHERS SECTION */}
      {otherCards.length > 0 && (
        <div>
          {pinnedCards.length > 0 && (
            <h2 className="font-archivo-black text-[1rem] m-0 mb-3 px-1 uppercase">
              Other Tasks
            </h2>
          )}
          <SortableContext items={otherCards.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 items-start">
              {otherCards.map((card) => (
                <TodoCard
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  isSharedDate={sharedDates.has(card.title.trim())}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}

      {cards.length === 0 && (
        <div className="text-center py-15 px-5 text-[#666] font-work-sans">
          <div className="text-[3rem] mb-4">📝</div>
          No tasks found. Click the + button to create one.
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setSelectedCard({ card: null, isReadOnly: false })} // null means create new
        className="fixed bottom-6 right-6 w-14 h-14 !rounded-full bg-[var(--border-color)] text-[var(--card-bg)] border-none text-[2rem] flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3)] z-30"
        title="Add new task"
      >
        +
      </button>

      {/* Card Modal */}
      {selectedCard !== undefined && (
        <CardModal
          card={selectedCard?.card}
          isReadOnly={selectedCard?.isReadOnly}
          onClose={async () => {
            // Release lock if we had one
            if (selectedCard?.card?.id && !selectedCard.isReadOnly) {
              try {
                await useTodoStore.getState().updateCard(selectedCard.card.id, { 
                  lockedBy: null, 
                  lockedAt: null 
                });
              } catch (e) {
                console.error('Failed to release lock', e);
              }
            }
            setSelectedCard(undefined);
          }}
        />
      )}
    </DndContext>
    </div>
  );
}
