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
    transform: CSS.Transform.toString(transform),
    transition,
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
  let cardClasses = `animate-fade-in border-[3px] border-[var(--border-color)] p-4 bg-[var(--card-bg)] flex flex-col gap-3 relative box-border transition-colors duration-150 cursor-pointer hover:bg-[var(--ghost-bg)] ${isDragging ? 'opacity-50 z-10' : 'opacity-100 z-1'}`;

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
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className={`p-1 -m-1 flex items-center justify-center text-[#999] touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
        <h3 className="font-archivo-black text-[1.05rem] m-0 leading-[1.25] break-words flex items-center gap-2">
          {card.title || formatThaiDate(card.createdAt ? new Date(card.createdAt) : new Date())}
          {isToday && <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" title="Today" />}
        </h3>
        </div>
        
        <div className="flex gap-2 items-center shrink-0">
          <AssigneeBadge assignee={card.assignee} size="small" />
          {card.isPinned && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                useTodoStore.getState().updateCard(card.id, { isPinned: false });
              }}
              className="inline-flex items-center bg-none border-none cursor-pointer p-0"
              title="Unpin task"
            >
              <PinIcon isPinned size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      {card.items && card.items.length > 0 && (
        <div className="flex flex-col gap-1">
          {card.items.map((item) => {
            const isPending = pendingNotifications.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 min-h-[32px] py-[2px] relative overflow-hidden ${item.isDone && !isPending ? 'opacity-45' : 'opacity-100'}`}
              >
                {isPending && (
                  <div className="absolute inset-0 pointer-events-none z-0 bg-[rgba(0,0,0,0.05)] border-b-2 border-[var(--border-color)]">
                    <div 
                      className="animate-undo-shrink h-full bg-[rgba(0,0,0,0.1)]"
                    />
                  </div>
                )}
                {/* Checkbox: click strictly toggles done state */}
                <div
                  onClick={(e) => handleToggle(e, item)}
                  className="flex items-center justify-center cursor-pointer p-1 shrink-0 z-1 hover:bg-[rgba(0,0,0,0.05)] rounded-sm transition-colors"
                  title={item.isDone ? 'Mark uncompleted' : 'Mark completed'}
                >
                  <input
                    type="checkbox"
                    className="rb-checkbox w-[20px] h-[20px] cursor-pointer pointer-events-none shrink-0"
                    checked={item.isDone}
                    readOnly
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
                  className="font-work-sans text-[0.9rem] leading-[1.3] flex-1 border-none border-b-2 border-[var(--border-color)] bg-[var(--card-bg)] outline-none py-[2px] px-1 box-border"
                />
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening modal
                    setEditingItemId(item.id);
                    setEditingText(item.text);
                  }}
                  className={`font-work-sans text-[0.9rem] leading-[1.3] flex-1 break-words cursor-text py-[2px] px-1 rounded-sm transition-colors hover:bg-[rgba(0,0,0,0.05)] ${item.isDone ? 'line-through' : 'no-underline'}`}
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
