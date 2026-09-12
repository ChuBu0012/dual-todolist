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
  MeasuringStrategy,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const measuringConfig = {
  draggable: {
    measure: (node: HTMLElement) => node.getBoundingClientRect(),
  },
  droppable: {
    measure: (node: HTMLElement) => node.getBoundingClientRect(),
    strategy: MeasuringStrategy.Always,
    frequency: 'optimized' as any,
  },
  dragOverlay: {
    measure: (node: HTMLElement) => node.getBoundingClientRect(),
  },
};

export function TodoList() {
  const cards = useTodoStore((s) => s.cards);
  const isLoading = useTodoStore((s) => s.isLoading);
  const reorderCards = useTodoStore((s) => s.reorderCards);
  
  const [selectedCard, setSelectedCard] = useState<{ card: CardItem | null, isReadOnly?: boolean } | undefined>(undefined);
  const currentUser = useAuthStore((s) => s.currentUser);

  const pinnedCards = useMemo(() => cards.filter(c => c.isPinned), [cards]);
  const otherCards = useMemo(() => cards.filter(c => !c.isPinned), [cards]);

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
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Space Mono, monospace' }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '96px', maxWidth: '840px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        measuring={measuringConfig}
      >
      
      {/* PINNED SECTION */}
      {pinnedCards.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontFamily: 'Archivo Black, sans-serif',
              fontSize: '0.95rem',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PinIcon isPinned size={14} /> Pinned
          </h2>
          <SortableContext items={pinnedCards.map(c => c.id)} strategy={rectSortingStrategy}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
                alignItems: 'start',
              }}
            >
              {pinnedCards.map((card) => (
                <TodoCard
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
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
            <h2 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: '1rem', margin: '0 0 12px 0', padding: '0 4px', textTransform: 'uppercase' }}>
              Other Tasks
            </h2>
          )}
          <SortableContext items={otherCards.map(c => c.id)} strategy={rectSortingStrategy}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
                alignItems: 'start',
              }}
            >
              {otherCards.map((card) => (
                <TodoCard
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}

      {cards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
          No tasks found. Click the + button to create one.
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setSelectedCard({ card: null, isReadOnly: false })} // null means create new
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: 'var(--border-color)',
          color: 'var(--card-bg)',
          border: 'none',
          fontSize: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 30,
        }}
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
