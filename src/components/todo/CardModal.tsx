import { useEffect } from "react";


import type { CardItem, TodoAssignee } from '../../types/todo';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
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
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const discordTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function CardModal({ card, onClose, isReadOnly }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const pendingNotifications = useTodoStore(s => s.pendingNotifications);
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

  const handleAddItem = () => {
    if (isReadOnly) return;
    const newItems = [...(localCard.items || []), { id: generateId(), text: '', isDone: false }];
    updateField({ items: newItems });
  };

  const handleItemChange = (id: string, text: string) => {
    if (isReadOnly) return;
    const newItems = (localCard.items || []).map((it) => (it.id === id ? { ...it, text } : it));
    updateField({ items: newItems });
  };

  const handleRemoveItem = (id: string) => {
    if (isReadOnly) return;
    const newItems = (localCard.items || []).filter((it) => it.id !== id);
    updateField({ items: newItems });
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
          const { discordService } = await import('../../services/discordService');
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
                    onEnter={handleAddItem}
                    autoFocus={!card && index === 0}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={handleAddItem}
            disabled={isReadOnly}
            className={`bg-none border-none font-work-sans text-[1rem] items-center gap-2 py-2 text-[#555] ${isReadOnly ? 'hidden' : 'flex cursor-pointer'}`}
          >
            <span className="text-[1.25rem]">+</span> ITEM
          </button>
        </div>

        {/* Error message banner */}
        {syncState === 'ERROR' && (
          <div className="p-2 px-3 bg-[var(--error-bg)] border-2 border-[var(--error-border)] text-[var(--error-text)] text-[0.85rem] mono mb-3 break-all">
            Failed to sync changes. Retrying...
          </div>
        )}
        </div>
      </div>
    </>
  );
}
