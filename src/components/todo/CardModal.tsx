import { useRef, useEffect } from 'react';
import type { CardItem, TodoAssignee } from '../../types/todo';
import { useAuthStore } from '../../store/authStore';
import { AssigneeBadge } from './AssigneeBadge';
import { useDebouncedCardSync } from '../../hooks/useDebouncedCardSync';
import { PinIcon } from './PinIcon';
import { formatThaiDate } from '../../utils/dateFormat';

interface Props {
  card?: CardItem | null;
  onClose: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function CardModal({ card, onClose }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { localCard, updateField, syncState, flush } = useDebouncedCardSync(card || null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!card) {
      titleInputRef.current?.focus();
    }
  }, [card]);

  const handleAssigneeCycle = () => {
    let next: TodoAssignee = 'most';
    if (localCard.assignee === 'most') next = 'fern';
    else if (localCard.assignee === 'fern') next = 'both';
    updateField({ assignee: next });
  };

  const handleAddItem = () => {
    const newItems = [...(localCard.items || []), { id: generateId(), text: '', isDone: false }];
    updateField({ items: newItems });
  };

  const handleItemChange = (id: string, text: string) => {
    const newItems = (localCard.items || []).map((it) => (it.id === id ? { ...it, text } : it));
    updateField({ items: newItems });
  };

  const handleRemoveItem = (id: string) => {
    const newItems = (localCard.items || []).filter((it) => it.id !== id);
    updateField({ items: newItems });
  };

  const handleToggleItemDone = (id: string) => {
    const newItems = (localCard.items || []).map((it) => {
      if (it.id === id) {
        const isDone = !it.isDone;
        return {
          ...it,
          isDone,
          completedBy: isDone ? currentUser : null,
          completedAt: isDone ? new Date().toISOString() : null,
        };
      }
      return it;
    });
    updateField({ items: newItems });
  };

  const handleClose = async () => {
    await flush();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 40,
        }}
      />

      {/* Panel: Responsive viewport clamp with screen margins */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '480px',
          backgroundColor: '#fff',
          border: '3px solid #000',
          padding: '16px',
          boxSizing: 'border-box',
          zIndex: 50,
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
            borderBottom: '2px solid #000',
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => updateField({ isPinned: !localCard.isPinned })}
              style={{
                width: '40px',
                height: '40px',
                background: localCard.isPinned ? '#000' : '#fff',
                color: localCard.isPinned ? '#fff' : '#000',
                border: '2px solid #000',
                cursor: 'pointer',
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
              style={{
                height: '40px',
                padding: '0 10px',
                background: '#fff',
                border: '2px solid #000',
                cursor: 'pointer',
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
                background: '#fff',
                border: '2px solid #000',
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
            ref={titleInputRef}
            className="rb-input"
            type="text"
            placeholder={formatThaiDate()}
            value={localCard.title || ''}
            onChange={(e) => updateField({ title: e.target.value })}
            maxLength={100}
            style={{
              fontSize: '1.25rem',
              fontFamily: 'Archivo Black, sans-serif',
              border: 'none',
              borderBottom: '2px solid #000',
              padding: '8px 0',
              marginBottom: '24px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {(localCard.items || []).map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#ccc', cursor: 'grab' }}>::</span>
                <input
                  type="checkbox"
                  className="rb-checkbox"
                  checked={item.isDone}
                  onChange={() => handleToggleItemDone(item.id)}
                  style={{ width: '20px', height: '20px', flexShrink: 0 }}
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                  placeholder="ITEM..."
                  style={{
                    flex: 1,
                    border: 'none',
                    borderBottom: '1px dashed #ccc',
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'transparent',
                    textDecoration: item.isDone ? 'line-through' : 'none',
                    opacity: item.isDone ? 0.5 : 1,
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.25rem', padding: '4px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: '1rem',
              display: 'flex',
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
              backgroundColor: '#fee2e2',
              border: '2px solid #ef4444',
              color: '#b91c1c',
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
    </>
  );
}
