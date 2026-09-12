import { useState } from 'react';
import type { CardItem, ChecklistItem } from '../../types/todo';
import { useTodoStore } from '../../store/todoStore';
import { AssigneeBadge } from './AssigneeBadge';
import { PinIcon } from './PinIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  card: CardItem;
  onClick: () => void;
}

export function TodoCard({ card, onClick }: Props) {
  const toggleChecklistItem = useTodoStore(s => s.toggleChecklistItem);
  const updateCard = useTodoStore(s => s.updateCard);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: '3px solid #000',
    padding: '16px',
    backgroundColor: '#fff',
    cursor: isDragging ? 'grabbing' : 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    touchAction: 'none', // Prevent default touch actions like scrolling when dragging
  };

  const handleToggle = (e: React.MouseEvent, item: ChecklistItem) => {
    e.stopPropagation(); // Prevent opening modal
    toggleChecklistItem(card.id, item.id, !item.isDone);
  };

  const handleSaveItemText = async (itemId: string) => {
    setEditingItemId(null);
    const trimmed = editingText.trim();
    const currentItem = card.items?.find(i => i.id === itemId);
    if (!currentItem || currentItem.text === trimmed) return;

    const updatedItems = (card.items || []).map(it =>
      it.id === itemId ? { ...it, text: trimmed } : it
    );

    try {
      await updateCard(card.id, { items: updatedItems });
    } catch (err) {
      console.error('Failed to update item text on card:', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        // Prevent click if we were dragging
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {/* Header: Title and Assignee/Pin icons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h3
          style={{
            fontFamily: 'Archivo Black, sans-serif',
            fontSize: '1.05rem',
            margin: 0,
            lineHeight: 1.25,
            wordBreak: 'break-word',
          }}
        >
          {card.title}
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <AssigneeBadge assignee={card.assignee} size="small" />
          {card.isPinned && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }} title="Pinned">
              <PinIcon isPinned size={16} />
            </span>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      {card.items && card.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {card.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '32px',
                padding: '2px 0',
                opacity: item.isDone ? 0.45 : 1,
              }}
            >
              {/* Checkbox: click strictly toggles done state */}
              <div
                onClick={(e) => handleToggle(e, item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '4px',
                  flexShrink: 0,
                }}
                title={item.isDone ? 'Mark uncompleted' : 'Mark completed'}
              >
                <input
                  type="checkbox"
                  className="rb-checkbox"
                  checked={item.isDone}
                  readOnly
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    pointerEvents: 'none',
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Text: click turns into input, blur saves */}
              {editingItemId === item.id ? (
                <input
                  type="text"
                  value={editingText}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => handleSaveItemText(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setEditingItemId(null);
                    }
                  }}
                  style={{
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: '0.9rem',
                    lineHeight: 1.3,
                    flex: 1,
                    border: 'none',
                    borderBottom: '2px solid #000',
                    background: '#fff',
                    outline: 'none',
                    padding: '2px 4px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening modal
                    setEditingItemId(item.id);
                    setEditingText(item.text);
                  }}
                  style={{
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: '0.9rem',
                    lineHeight: 1.3,
                    textDecoration: item.isDone ? 'line-through' : 'none',
                    flex: 1,
                    wordBreak: 'break-word',
                    cursor: 'text',
                    padding: '2px 4px',
                  }}
                  title="Click to edit"
                >
                  {item.text}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
