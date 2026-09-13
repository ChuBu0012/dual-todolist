
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
  autoFocus?: boolean;
}

export function SortableChecklistItem({ item, isReadOnly, isPending, onToggle, onChangeText, onRemove, onEnter, autoFocus }: Props) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-[12px] relative overflow-hidden bg-[var(--card-bg)] ${isDragging ? 'opacity-50 z-10' : 'opacity-100 z-1'}`}
    >
      {isPending && (
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-[rgba(0,0,0,0.05)] border-b-2 border-[var(--border-color)]"
        >
          <div 
            className="animate-undo-shrink h-full bg-[rgba(0,0,0,0.1)]"
          />
        </div>
      )}
      <span
        {...(isReadOnly ? {} : attributes)}
        {...(isReadOnly ? {} : listeners)}
        className={`text-[var(--border-color)] z-1 p-[4px] touch-none ${isReadOnly ? 'cursor-default opacity-50' : 'cursor-grab opacity-100'}`}
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
      
      <div className="relative group">
        <div
          onClick={() => !isReadOnly && onToggle(item.id)}
          className={`flex items-center justify-center p-2 shrink-0 z-1 transition-colors rounded-sm ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-[rgba(0,0,0,0.05)]'}`}
        >
          <input
            type="checkbox"
            className={`rb-checkbox w-[20px] h-[20px] shrink-0 z-1 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            checked={item.isDone}
            readOnly
            disabled={isReadOnly}
          />
        </div>
      </div>
      
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
        autoFocus={autoFocus}
        readOnly={isReadOnly}
        className={`flex-1 border-none border-b border-dashed border-[#ccc] font-work-sans text-[1rem] outline-none bg-transparent text-[var(--border-color)] ${item.isDone ? 'line-through' : 'no-underline'} ${item.isDone || isReadOnly ? 'opacity-50' : 'opacity-100'}`}
      />
      
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={isReadOnly}
        className={`bg-none border-none text-[var(--error-text)] text-[1.2rem] px-[4px] z-1 ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
        title="Remove item"
      >
        ×
      </button>
    </div>
  );
}
