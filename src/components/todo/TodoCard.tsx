import { useState, useRef } from 'react';
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
  searchQuery?: string;
}

const HighlightedText = ({ text, query }: { text: string, query?: string }) => {
  if (!query || !query.trim()) return <>{text}</>;
  
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() 
          ? <span key={i} className="bg-yellow-200 text-black px-[2px] rounded-sm">{part}</span> 
          : part
      )}
    </>
  );
};

export function TodoCard({ card, onClick, isSharedDate, searchQuery }: Props) {
  const toggleChecklistItem = useTodoStore(s => s.toggleChecklistItem);
  const updateCard = useTodoStore(s => s.updateCard);
  const pendingNotifications = useTodoStore(s => s.pendingNotifications);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const ignoreBlurRef = useRef(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectMode) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsSelectMode(true);
      longPressTimerRef.current = null;
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };


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
    if (isSelectMode) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } else {
      toggleChecklistItem(card.id, item.id, !item.isDone);
    }
  };

  const handleDeleteSelected = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.items || selectedItems.size === 0) return;
    if (!window.confirm(`Delete ${selectedItems.size} selected task(s)?`)) return;
    
    const remaining = card.items.filter(it => !selectedItems.has(it.id));
    try {
      await updateCard(card.id, { items: remaining });
      setIsSelectMode(false);
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Failed to delete selected items:', err);
    }
  };

  const handleSaveItemText = async (itemId: string) => {
    if (ignoreBlurRef.current) return;
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

  const handleSortItems = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.items || card.items.length === 0) return;
    const sortedItems = [...card.items].sort((a, b) => {
      if (a.isDone === b.isDone) return 0;
      return a.isDone ? 1 : -1;
    });
    try {
      await updateCard(card.id, { items: sortedItems });
    } catch (err) {
      console.error('Failed to sort items:', err);
    }
  };

  const isToday = card.title === formatThaiDate();
  
  // Base classes
  let cardClasses = `group break-inside-avoid mb-3 animate-fade-in border-[3px] border-[var(--border-color)] p-4 bg-[var(--card-bg)] flex flex-col gap-3 relative box-border transition-colors duration-150 cursor-pointer hover:bg-[var(--ghost-bg)] ${isDragging ? 'opacity-50 z-10' : 'opacity-100 z-1'}`;

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
          <HighlightedText text={card.title || formatThaiDate(card.createdAt ? new Date(card.createdAt) : new Date())} query={searchQuery} />
          {isToday && <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" title="Today" />}
        </h3>
        </div>
        
        <div className="flex gap-2 items-center shrink-0">
          {isSelectMode && (
            <>
              {selectedItems.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center text-red-500 hover:text-red-700 cursor-pointer p-0"
                  title="Delete Selected"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectMode(false);
                  setSelectedItems(new Set());
                }}
                className="inline-flex items-center text-[#666] hover:text-black cursor-pointer p-0 text-xs font-bold font-work-sans"
              >
                CANCEL
              </button>
            </>
          )}

          <button
            onClick={handleSortItems}
            className="inline-flex items-center text-[#666] hover:text-black cursor-pointer p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Sort tasks (pending first)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16" />
              <path d="M4 12h10" />
              <path d="M4 18h4" />
            </svg>
          </button>
          <AssigneeBadge assignee={card.assignee} size="small" />
          {card.isPinned ? (
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
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                useTodoStore.getState().updateCard(card.id, { isPinned: true });
              }}
              className="inline-flex items-center bg-none border-none cursor-pointer p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              title="Pin task"
            >
              <PinIcon isPinned={false} size={16} />
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
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  onContextMenu={(e) => e.preventDefault()}
                  className="flex items-center justify-center cursor-pointer p-1 shrink-0 z-1 hover:bg-[rgba(0,0,0,0.05)] rounded-sm transition-colors select-none touch-callout-none"
                  title={item.isDone ? 'Mark uncompleted' : 'Mark completed'}
                >
                  <input
                    type="checkbox"
                    className="rb-checkbox w-[20px] h-[20px] cursor-pointer pointer-events-none shrink-0"
                    checked={isSelectMode ? selectedItems.has(item.id) : item.isDone}
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
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      ignoreBlurRef.current = true;
                      
                      const currentText = e.currentTarget.value.trim();
                      const currentItemIndex = (card.items || []).findIndex(i => i.id === item.id);
                      if (currentItemIndex === -1) {
                        ignoreBlurRef.current = false;
                        return;
                      }

                      let updatedItems = [...(card.items || [])];
                      if (updatedItems[currentItemIndex].text !== currentText) {
                        updatedItems[currentItemIndex] = { ...updatedItems[currentItemIndex], text: currentText };
                      }

                      const newId = Math.random().toString(36).substr(2, 9);
                      const newItem = { id: newId, text: '', isDone: false };
                      updatedItems.splice(currentItemIndex + 1, 0, newItem);
                      
                      setEditingText('');
                      setEditingItemId(newId);
                      
                      try {
                        await updateCard(card.id, { items: updatedItems });
                      } catch (err) {
                        console.error('Failed to create new item:', err);
                      } finally {
                        setTimeout(() => { ignoreBlurRef.current = false; }, 100);
                      }
                    } else if (e.key === 'Escape') {
                      setEditingItemId(null);
                    }
                  }}
                  onPaste={async (e) => {
                    const paste = e.clipboardData.getData('text');
                    if (!paste) return;
                    const itemsText = paste
                      .split(/[\n,]+| \- /)
                      .map(s => s.replace(/^(?:\d+\.|\-|•)\s*/, '').trim())
                      .filter(Boolean);
                      
                    if (itemsText.length > 1) {
                      e.preventDefault();
                      ignoreBlurRef.current = true;
                      
                      const currentItemIndex = (card.items || []).findIndex(i => i.id === item.id);
                      if (currentItemIndex === -1) {
                         ignoreBlurRef.current = false;
                         return;
                      }

                      let updatedItems = [...(card.items || [])];
                      
                      // Store state for undo
                      useTodoStore.getState().setUndoPasteState({
                        cardId: card.id,
                        previousItems: [...updatedItems]
                      });
                      
                      const newItems = itemsText.map(text => ({
                        id: Math.random().toString(36).substr(2, 9),
                        text,
                        isDone: false
                      }));

                      if (updatedItems[currentItemIndex].text.trim() === '') {
                        updatedItems[currentItemIndex] = { ...updatedItems[currentItemIndex], text: newItems[0].text };
                        updatedItems.splice(currentItemIndex + 1, 0, ...newItems.slice(1));
                      } else {
                        updatedItems.splice(currentItemIndex + 1, 0, ...newItems);
                      }
                      
                      const lastNewId = newItems[newItems.length - 1].id;
                      setEditingText(newItems[newItems.length - 1].text);
                      setEditingItemId(lastNewId);
                      
                      try {
                        await updateCard(card.id, { items: updatedItems });
                      } catch (err) {
                        console.error('Failed to create items from paste:', err);
                      } finally {
                        setTimeout(() => { ignoreBlurRef.current = false; }, 100);
                      }
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
                  <HighlightedText text={item.text} query={searchQuery} />
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
