
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistItem } from '../../types/todo';

interface Props {
  item: ChecklistItem;
  isReadOnly?: boolean;
  isPending?: boolean;
  onToggle: (id: string) => void;
  onChangeText: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onEnter?: () => void;
}

export function SortableChecklistItem({ item, isReadOnly, isPending, onToggle, onChangeText, onRemove, onEnter }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: 'var(--card-bg)', // ensure it has bg when dragging
  };

  return (
    <div ref={setNodeRef} style={style}>
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
      <span
        {...(isReadOnly ? {} : attributes)}
        {...(isReadOnly ? {} : listeners)}
        style={{
          color: 'var(--border-color)',
          cursor: isReadOnly ? 'default' : 'grab',
          zIndex: 1,
          opacity: isReadOnly ? 0.5 : 1,
          padding: '4px',
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
      </span>
      
      <input
        type="checkbox"
        className="rb-checkbox"
        checked={item.isDone}
        onChange={() => onToggle(item.id)}
        disabled={isReadOnly}
        style={{ width: '20px', height: '20px', flexShrink: 0, zIndex: 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
      />
      
      <input
        type="text"
        value={item.text}
        onChange={(e) => onChangeText(item.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="ITEM..."
        readOnly={isReadOnly}
        style={{
          flex: 1,
          border: 'none',
          borderBottom: '1px dashed #ccc',
          fontFamily: 'Work Sans, sans-serif',
          fontSize: '1rem',
          outline: 'none',
          background: 'transparent',
          textDecoration: item.isDone ? 'line-through' : 'none',
          opacity: item.isDone || isReadOnly ? 0.5 : 1,
          color: 'var(--border-color)',
        }}
      />
      
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={isReadOnly}
        style={{
          background: 'none',
          border: 'none',
          cursor: isReadOnly ? 'not-allowed' : 'pointer',
          color: 'var(--error-text)',
          fontSize: '1.2rem',
          padding: '0 4px',
          opacity: isReadOnly ? 0.5 : 1,
          zIndex: 1,
        }}
        title="Remove item"
      >
        ×
      </button>
    </div>
  );
}
