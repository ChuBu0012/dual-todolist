import { useState, useMemo } from 'react';
import { useTodoStore } from '../../store/todoStore';
import { TodoCard } from './TodoCard';
import { CardModal } from './CardModal';
import { PinIcon } from './PinIcon';
import type { CardItem } from '../../types/todo';
import {
  DndContext,
  closestCenter,
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
  
  const [selectedCard, setSelectedCard] = useState<CardItem | null | undefined>(undefined);

  const pinnedCards = useMemo(() => cards.filter(c => c.isPinned), [cards]);
  const otherCards = useMemo(() => cards.filter(c => !c.isPinned), [cards]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the lists
    const activeCard = cards.find(c => c.id === active.id);
    const overCard = cards.find(c => c.id === over.id);

    if (!activeCard || !overCard) return;
    
    // We only allow sorting within the same list (Pinned vs Other)
    if (activeCard.isPinned !== overCard.isPinned) return;

    const list = activeCard.isPinned ? pinnedCards : otherCards;
    const oldIndex = list.findIndex(c => c.id === active.id);
    const newIndex = list.findIndex(c => c.id === over.id);

    const reorderedList = arrayMove(list, oldIndex, newIndex);
    
    // Combine with the other list to get the full ordered ids
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
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
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
                  onClick={() => setSelectedCard(card)}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}

      {/* OTHERS SECTION */}
      {otherCards.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontFamily: 'Archivo Black, sans-serif',
              fontSize: '0.95rem',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Tasks
          </h2>
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
                  onClick={() => setSelectedCard(card)}
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
        onClick={() => setSelectedCard(null)} // null means create new
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: '#000',
          color: '#fff',
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
          card={selectedCard}
          onClose={() => setSelectedCard(undefined)}
        />
      )}
    </DndContext>
    </div>
  );
}
