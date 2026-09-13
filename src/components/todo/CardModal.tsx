
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
        className="animate-fade-in"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--overlay-bg)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '480px',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div
          className="animate-fade-up"
          style={{
            pointerEvents: 'auto',
            backgroundColor: 'var(--card-bg)',
            border: '3px solid var(--border-color)',
            padding: '16px',
            boxSizing: 'border-box',
            maxHeight: '88dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        {/* Header Options: 40px touch targets */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!card && (
              <span
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                NEW TASK
              </span>
            )}
            {isReadOnly && (
              <span
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--error-text)',
                  backgroundColor: 'var(--error-bg)',
                  padding: '4px 8px',
                  border: '1px solid var(--error-border)',
                  marginLeft: card ? 0 : '8px'
                }}
              >
                LOCKED BY {localCard.lockedBy?.toUpperCase()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => updateField({ isPinned: !localCard.isPinned })}
              disabled={isReadOnly}
              style={{
                width: '40px',
                height: '40px',
                background: localCard.isPinned ? 'var(--border-color)' : 'var(--card-bg)',
                color: localCard.isPinned ? 'var(--card-bg)' : 'var(--border-color)',
                border: '2px solid var(--border-color)',
                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                opacity: isReadOnly ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={localCard.isPinned ? 'Unpin task' : 'Pin task'}
            >
              <PinIcon isPinned={localCard.isPinned} size={18} />
            </button>

            {/* Assignee Cycle Button */}
            <button
              type="button"
              onClick={handleAssigneeCycle}
              disabled={isReadOnly}
              style={{
                height: '40px',
                padding: '0 10px',
                background: 'var(--card-bg)',
                border: '2px solid var(--border-color)',
                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                opacity: isReadOnly ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              title="Click to switch assignee: Most -> Fern -> Both"
            >
              <span
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#555',
                }}
              >
                FOR:
              </span>
              <AssigneeBadge assignee={localCard.assignee || 'both'} size="medium" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--card-bg)',
                border: '2px solid var(--border-color)',
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontWeight: 700,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '16px' }}>
          {/* Title input */}
          <input
            className="rb-input"
            type="text"
            placeholder={formatThaiDate()}
            value={localCard.title || ''}
            onChange={(e) => updateField({ title: e.target.value })}
            maxLength={100}
            readOnly={isReadOnly}
            style={{
              fontSize: '1.25rem',
              fontFamily: 'Archivo Black, sans-serif',
              border: 'none',
              borderBottom: '2px solid var(--border-color)',
              padding: '8px 0',
              marginBottom: '24px',
              width: '100%',
              boxSizing: 'border-box',
              opacity: isReadOnly ? 0.7 : 1,
            }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
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
            style={{
              background: 'none',
              border: 'none',
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: '1rem',
              display: isReadOnly ? 'none' : 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0',
              color: '#555',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>+</span> ITEM
          </button>
        </div>

        {/* Error message banner */}
        {syncState === 'ERROR' && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--error-bg)',
              border: '2px solid var(--error-border)',
              color: 'var(--error-text)',
              fontSize: '0.85rem',
              fontFamily: 'Space Mono, monospace',
              marginBottom: '12px',
              wordBreak: 'break-all',
            }}
          >
            Failed to sync changes. Retrying...
          </div>
        )}
        </div>
      </div>
    </>
  );
}
