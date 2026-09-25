import { useEffect, useState } from "react";


import type { CardItem, TodoAssignee } from '../../types/todo';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
import { firestoreService } from '../../services/firestoreService';
import { discordService } from '../../services/discordService';
import { AssigneeBadge } from './AssigneeBadge';
import { useDebouncedCardSync } from '../../hooks/useDebouncedCardSync';
import { PinIcon } from './PinIcon';
import { formatThaiDate } from '../../utils/dateFormat';
import { DndContext, closestCorners, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableChecklistItem } from './SortableChecklistItem';
import type { Modifier } from '@dnd-kit/core';

const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

interface Props {
  card?: CardItem | null;
  onClose: () => void;
  isReadOnly?: boolean;
  autoFocusEmpty?: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const discordTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function CardModal({ card, onClose, isReadOnly, autoFocusEmpty }: Props) {
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [movingItemIds, setMovingItemIds] = useState<string[]>([]);
  const [isMoveSheetOpen, setIsMoveSheetOpen] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);
  const pendingNotifications = useTodoStore(s => s.pendingNotifications);
  const allCards = useTodoStore(s => s.cards);
  const { localCard, updateField, syncState, flush } = useDebouncedCardSync(card || null);




  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortItems = () => {
    if (isReadOnly || !localCard.items) return;
    const sortedItems = [...localCard.items].sort((a, b) => {
      if (a.isDone === b.isDone) return 0;
      return a.isDone ? 1 : -1;
    });
    updateField({ items: sortedItems });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || isReadOnly) return;

    const oldIndex = (localCard.items || []).findIndex(i => i.id === active.id);
    const newIndex = (localCard.items || []).findIndex(i => i.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      updateField({ items: arrayMove(localCard.items || [], oldIndex, newIndex) });
    }
  };




  const handleAssigneeCycle = () => {
    if (isReadOnly) return;
    const next = localCard.assignee === currentUser ? 'both' : currentUser;
    updateField({ assignee: next as TodoAssignee });
  };

  const handleAddItem = (afterId?: string) => {
    if (isReadOnly) return;
    const newId = generateId();
    const newItem = { id: newId, text: '', isDone: false };
    
    let newItems;
    if (afterId) {
      const idx = (localCard.items || []).findIndex(i => i.id === afterId);
      newItems = [...(localCard.items || [])];
      newItems.splice(idx + 1, 0, newItem);
    } else {
      newItems = [...(localCard.items || []), newItem];
    }
    
    updateField({ items: newItems });
    setFocusedItemId(newId);
  };

  useEffect(() => {
    if (autoFocusEmpty && !isReadOnly) {
      if (localCard.items && localCard.items.length > 0) {
        const lastItem = localCard.items[localCard.items.length - 1];
        if (lastItem.text.trim() === '') {
          setFocusedItemId(lastItem.id);
        } else {
          handleAddItem();
        }
      } else {
        handleAddItem();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePasteItems = (afterId: string, texts: string[]) => {
    if (isReadOnly || texts.length === 0) return;
    const newItems = texts.map(text => ({
      id: generateId(),
      text,
      isDone: false
    }));
    
    let updatedItems = [...(localCard.items || [])];
    const idx = updatedItems.findIndex(i => i.id === afterId);
    
    if (idx !== -1) {
      if (updatedItems[idx].text.trim() === '') {
        updatedItems[idx] = { ...updatedItems[idx], text: newItems[0].text };
        updatedItems.splice(idx + 1, 0, ...newItems.slice(1));
      } else {
        updatedItems.splice(idx + 1, 0, ...newItems);
      }
    } else {
      updatedItems = [...updatedItems, ...newItems];
    }
    
    updateField({ items: updatedItems });
    setFocusedItemId(newItems[newItems.length - 1].id);
  };

  const handleItemChange = (id: string, text: string) => {
    if (isReadOnly) return;
    const newItems = (localCard.items || []).map((it) => (it.id === id ? { ...it, text } : it));
    updateField({ items: newItems });
  };

  const handleRemoveItem = (id: string) => {
    if (isReadOnly) return;
    const items = localCard.items || [];
    const index = items.findIndex((it) => it.id === id);
    const newItems = items.filter((it) => it.id !== id);
    updateField({ items: newItems });
    
    if (index > 0) {
      setFocusedItemId(items[index - 1].id);
    } else if (newItems.length > 0) {
      setFocusedItemId(newItems[0].id);
    } else {
      setFocusedItemId(null);
    }
  };

  const handleToggleItemDone = (id: string) => {
    if (isReadOnly) return;
    let toggledItemText = '';
    let isNowDone = false;
    let cardTitle = localCard.title || 'Untitled';
    
    const newItems = (localCard.items || []).map((it) => {
      if (it.id === id) {
        isNowDone = !it.isDone;
        toggledItemText = it.text;
        return {
          ...it,
          isDone: isNowDone,
          completedBy: isNowDone ? currentUser : null,
          completedAt: isNowDone ? new Date().toISOString() : null,
        };
      }
      return it;
    });
    updateField({ items: newItems });

    // Handle Discord Notification Delay
    if (isNowDone) {
      useTodoStore.setState(s => ({
        pendingNotifications: [...s.pendingNotifications, id]
      }));
      // Using global timer map to avoid duplication
      if (discordTimers[id]) {
        clearTimeout(discordTimers[id]);
      }
      
      discordTimers[id] = setTimeout(async () => {
        try {
          await discordService.sendTaskCompleted(cardTitle, toggledItemText, currentUser || 'both');
        } catch (e) {
          console.error(e);
        } finally {
          useTodoStore.setState(s => ({
            pendingNotifications: s.pendingNotifications.filter(pid => pid !== id)
          }));
          delete discordTimers[id];
        }
      }, 1500);
    } else {
      useTodoStore.setState(s => ({
        pendingNotifications: s.pendingNotifications.filter(pid => pid !== id)
      }));
      if (discordTimers[id]) {
        clearTimeout(discordTimers[id]);
        delete discordTimers[id];
      }
    }
  };

  const handleMoveItems = async (targetCardId: string) => {
    if (movingItemIds.length === 0 || isReadOnly) return;
    setMoveError(null);
    const originalItems = localCard.items || [];
    try {
      const targetCard = allCards.find(c => c.id === targetCardId);
      if (!targetCard) return;

      const itemsToMove = originalItems.filter(it => movingItemIds.includes(it.id));
      if (itemsToMove.length === 0) return;

      // 1. Remove from current card
      const newItems = originalItems.filter(it => !movingItemIds.includes(it.id));
      updateField({ items: newItems }); // optimistic

      // 2. Add to target card
      const targetItems = [...(targetCard.items || []), ...itemsToMove];
      await firestoreService.updateCard(targetCard.id, { items: targetItems });

      setMovingItemIds([]);
      setIsMoveSheetOpen(false);
    } catch (e) {
      console.error('Move failed', e);
      updateField({ items: originalItems });
      setMoveError('Could not move the selected items. Your changes were restored.');
    }
  };

  const handleClose = () => {
    flush();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="animate-fade-in fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm z-40"
      />

      {/* Modal Container */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[480px] z-50 pointer-events-none"
      >
        <div
          className="animate-fade-up pointer-events-auto bg-[var(--card-bg)] border-[3px] border-[var(--border-color)] p-4 box-border max-h-[88dvh] flex flex-col"
        >
        {/* Header Options: 40px touch targets */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-[var(--border-color)] pb-3">
          <div className="flex items-center">
            {!card && (
              <span className="mono text-[0.75rem] font-bold tracking-[0.08em] uppercase">
                NEW TASK
              </span>
            )}
            {isReadOnly && (
              <span className={`mono text-[0.75rem] font-bold text-[var(--error-text)] bg-[var(--error-bg)] px-2 py-1 border border-[var(--error-border)] ${card ? '' : 'ml-2'}`}>
                LOCKED BY {localCard.lockedBy?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={handleSortItems}
              disabled={isReadOnly}
              className="inline-flex items-center bg-none border-none cursor-pointer p-1 text-[#666] hover:text-black hover:bg-[rgba(0,0,0,0.05)] rounded disabled:opacity-50"
              title="Sort tasks (pending first)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16" />
                <path d="M4 12h10" />
                <path d="M4 18h4" />
              </svg>
            </button>
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => updateField({ isPinned: !localCard.isPinned })}
              disabled={isReadOnly}
              className={`w-[40px] h-[40px] border-2 border-[var(--border-color)] flex items-center justify-center transition-colors ${localCard.isPinned ? 'bg-[var(--border-color)] text-[var(--card-bg)] hover:bg-[var(--card-bg)] hover:text-[var(--border-color)]' : 'bg-[var(--card-bg)] text-[var(--border-color)] hover:bg-[var(--border-color)] hover:text-[var(--card-bg)]'} ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
              title={localCard.isPinned ? 'Unpin task' : 'Pin task'}
            >
              <PinIcon isPinned={localCard.isPinned} size={18} />
            </button>

            {/* Assignee Cycle Button */}
            <button
              type="button"
              onClick={handleAssigneeCycle}
              disabled={isReadOnly}
              className={`h-[40px] px-[10px] bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center gap-2 ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
              title="Click to switch assignee: Most -> Fern -> Both"
            >
              <span className="mono text-[0.7rem] font-bold text-[#555]">
                FOR:
              </span>
              <AssigneeBadge assignee={localCard.assignee || 'both'} size="medium" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-[40px] h-[40px] bg-[var(--card-bg)] border-2 border-[var(--border-color)] cursor-pointer mono font-bold text-[1.1rem] flex items-center justify-center"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pb-4">
          {/* Title input */}
          <input
            className={`rb-input text-[1.25rem] font-archivo-black border-none border-b-2 border-[var(--border-color)] py-2 mb-6 w-full box-border ${isReadOnly ? 'opacity-70' : 'opacity-100'}`}
            type="text"
            placeholder={formatThaiDate()}
            value={localCard.title || ''}
            onChange={(e) => updateField({ title: e.target.value })}
            maxLength={100}
            readOnly={isReadOnly}
          />

          {/* Checklist Items */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={(localCard.items || []).map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 mb-4">
                {(localCard.items || []).map((item, index) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    isReadOnly={isReadOnly}
                    isPending={pendingNotifications.includes(item.id)}
                    onToggle={handleToggleItemDone}
                    onChangeText={handleItemChange}
                    onRemove={handleRemoveItem}
                    onEnter={() => handleAddItem(item.id)}
                    onPasteItems={(texts) => handlePasteItems(item.id, texts)}
                    onLongPress={() => {
                      if (!movingItemIds.includes(item.id)) {
                        setMovingItemIds([...movingItemIds, item.id]);
                      }
                    }}
                    selectionMode={movingItemIds.length > 0}
                    isSelected={movingItemIds.includes(item.id)}
                    onSelectToggle={() => {
                      if (movingItemIds.includes(item.id)) {
                        setMovingItemIds(movingItemIds.filter(id => id !== item.id));
                      } else {
                        setMovingItemIds([...movingItemIds, item.id]);
                      }
                    }}
                    onFocus={() => setFocusedItemId(item.id)}
                    autoFocus={(!card && index === 0 && !focusedItemId) || focusedItemId === item.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {movingItemIds.length > 0 ? (
            <div className="flex items-center justify-between p-3 border-2 border-[var(--border-color)] bg-[var(--border-color)] text-[var(--card-bg)] mt-4">
              <span className="font-archivo-black uppercase">
                {movingItemIds.length} Selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMovingItemIds([])}
                  className="px-3 py-1 bg-transparent border border-[var(--card-bg)] text-[var(--card-bg)] font-bold mono text-[0.8rem]"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => setIsMoveSheetOpen(true)}
                  className="px-3 py-1 bg-[var(--card-bg)] text-[var(--border-color)] border-none font-bold mono text-[0.8rem]"
                >
                  MOVE
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAddItem()}
              disabled={isReadOnly}
              className={`bg-none border-none font-work-sans text-[1rem] items-center gap-2 py-2 text-[#555] ${isReadOnly ? 'hidden' : 'flex cursor-pointer'}`}
            >
              <span className="text-[1.25rem]">+</span> ITEM
            </button>
          )}
        </div>

        {/* Error message banner */}
        {syncState === 'ERROR' && (
          <div className="p-2 px-3 bg-[var(--error-bg)] border-2 border-[var(--error-border)] text-[var(--error-text)] text-[0.85rem] mono mb-3 break-all">
            Failed to sync changes. Retrying...
          </div>
        )}
        </div>
      </div>

      {/* Move Item Bottom Sheet */}
      {isMoveSheetOpen && (
        <div 
          onClick={() => setIsMoveSheetOpen(false)}
          className="fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm z-[60] flex items-end justify-center pointer-events-auto"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[480px] bg-[var(--card-bg)] border-t-[3px] border-[var(--border-color)] p-4 animate-fade-up flex flex-col max-h-[80vh]"
          >
            <h3 className="mono font-bold mb-4 uppercase tracking-widest text-[0.8rem] text-[var(--border-color)]">
              Move to...
            </h3>
            {moveError && (
              <div className="mb-3 p-2 border-2 border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)] mono text-[0.75rem]">
                {moveError}
              </div>
            )}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {allCards.filter(c => c.id !== localCard.id).map(c => {
                const isToday = c.title.trim().toLowerCase() === formatThaiDate(new Date()).toLowerCase();
                const assigneeIcon = c.assignee === 'most' ? 'M' : c.assignee === 'fern' ? 'F' : 'FM';
                const baseName = isToday ? 'TODAY' : (c.title || 'Untitled');
                return (
                  <button
                    key={c.id}
                    onClick={() => handleMoveItems(c.id)}
                    className="p-3 border-2 border-[var(--border-color)] text-left hover:bg-[rgba(0,0,0,0.05)] bg-[var(--bg-color)] truncate font-archivo-black text-[var(--border-color)] flex justify-between items-center"
                  >
                    <span>{baseName}</span>
                    <span className="text-[0.7rem] bg-[var(--border-color)] text-[var(--card-bg)] px-2 py-0.5 rounded-sm ml-2">
                      {assigneeIcon}
                    </span>
                  </button>
                );
              })}
              {allCards.filter(c => c.id !== localCard.id).length === 0 && (
                <div className="text-center text-[#888] py-4 mono text-[0.8rem]">NO OTHER CARDS</div>
              )}
            </div>
            <button
              onClick={() => setIsMoveSheetOpen(false)}
              className="mt-4 p-3 border-2 border-[var(--border-color)] bg-[var(--border-color)] text-[var(--card-bg)] font-bold mono uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
