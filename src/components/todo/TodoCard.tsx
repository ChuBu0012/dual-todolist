import { useState } from 'react';
import type { CardItem, ChecklistItem } from '../../types/todo';
import { useTodoStore } from '../../store/todoStore';
import { AssigneeBadge } from './AssigneeBadge';
import { PinIcon } from './PinIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatThaiDate } from '../../utils/dateFormat';

interface Props {
  card: CardItem;
  onClick: () => void;
  isSharedDate?: boolean;
}

export function TodoCard({ card, onClick, isSharedDate }: Props) {
  const toggleChecklistItem = useTodoStore(s => s.toggleChecklistItem);
  const updateCard = useTodoStore(s => s.updateCard);
  const pendingNotifications = useTodoStore(s => s.pendingNotifications);

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
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
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

  const isToday = card.title === formatThaiDate();
  
  // Base classes
  let cardClasses = `animate-fade-in border-[3px] border-[var(--border-color)] p-4 bg-[var(--card-bg)] flex flex-col gap-3 relative box-border transition-all ${isDragging ? 'opacity-50' : 'opacity-100'}`;

  // Shared Date styling (3D shadow + dashed border)
  if (isSharedDate) {
    cardClasses += ` border-dashed -translate-y-1 -translate-x-1 shadow-[6px_6px_0_0_var(--border-color)]`;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
      onClick={() => {
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {/* Header: Title and Assignee/Pin icons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '4px',
              margin: '-4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              touchAction: 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
        <h3
          style={{
            fontFamily: 'Archivo Black, sans-serif',
            fontSize: '1.05rem',
            margin: 0,
            lineHeight: 1.25,
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {card.title || formatThaiDate(card.createdAt ? new Date(card.createdAt) : new Date())}
          {isToday && <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" title="Today" />}
        </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <AssigneeBadge assignee={card.assignee} size="small" />
          {card.isPinned && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                useTodoStore.getState().updateCard(card.id, { isPinned: false });
              }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: 0
              }} 
              title="Unpin task"
            >
              <PinIcon isPinned size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      {card.items && card.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {card.items.map((item) => {
            const isPending = pendingNotifications.includes(item.id);
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '32px',
                  padding: '2px 0',
                  opacity: item.isDone && !isPending ? 0.45 : 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isPending && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      pointerEvents: 'none',
                      zIndex: 0,
                      background: 'rgba(0,0,0,0.05)',
                      borderBottom: '2px solid var(--border-color)'
                    }}
                  >
                    <div 
                      className="animate-undo-shrink"
                      style={{ height: '100%', background: 'rgba(0,0,0,0.1)' }}
                    />
                  </div>
                )}
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
                    zIndex: 1,
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
                    borderBottom: '2px solid var(--border-color)',
                    background: 'var(--card-bg)',
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
            );
          })}
        </div>
      )}
    </div>
  );
}
