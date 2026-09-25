import { useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlarmClock } from 'lucide-react';

import type { ChecklistItem } from '../../types/todo';

interface Props {
  item: ChecklistItem;
  isReadOnly?: boolean;
  isPending?: boolean;
  onToggle: (id: string) => void;
  onChangeText: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onEnter?: () => void;
  onLongPress?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  onPasteItems?: (texts: string[]) => void;
}

export function SortableChecklistItem({ item, isReadOnly, isPending, onToggle, onChangeText, onRemove, onEnter, onLongPress, onFocus, autoFocus, selectionMode, isSelected, onSelectToggle, onPasteItems }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to the end of the text
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [autoFocus, item.id]);

  const startLongPress = (e: React.PointerEvent) => {
    if (isReadOnly || !onLongPress) return;
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
    
    startPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      onLongPress();
      // Vibrate to provide feedback if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPos.current || !longPressTimer.current) return;
    
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const distance = Math.hypot(dx, dy);
    
    // Only cancel if finger moved more than 10 pixels
    if (distance > 10) {
      cancelLongPress();
    }
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    startPos.current = null;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-[12px] relative overflow-hidden bg-[var(--card-bg)] transition-all ${isDragging ? 'opacity-50 z-10' : 'opacity-100 z-1'} ${isSelected ? 'outline outline-2 outline-[var(--border-color)] outline-offset-[-2px]' : ''}`}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerMove={handlePointerMove}
    >
      {selectionMode && (
        <div 
          onClick={onSelectToggle}
          className={`absolute inset-0 z-20 cursor-pointer ${isSelected ? 'bg-[var(--border-color)] opacity-20' : 'bg-transparent hover:bg-[rgba(0,0,0,0.05)]'}`}
        />
      )}
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
        ref={inputRef}
        type="text"
        value={item.text}
        onChange={(e) => onChangeText(item.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            if (item.text.trim() === '') {
              e.currentTarget.blur();
              return;
            }
            onEnter();
          } else if (e.key === 'Backspace' && item.text === '') {
            e.preventDefault();
            onRemove(item.id);
          }
        }}
        onPaste={(e) => {
          if (!onPasteItems) return;
          const paste = e.clipboardData.getData('text');
          if (!paste) return;
          const itemsText = paste
            .split(/[\n,]+| \- /)
            .map(s => s.replace(/^(?:\d+\.|\-|•)\s*/, '').trim())
            .filter(Boolean);
          
          if (itemsText.length > 1) {
            e.preventDefault();
            onPasteItems(itemsText);
          }
        }}
        placeholder="ITEM..."
        readOnly={isReadOnly}
        onFocus={onFocus}
        className={`flex-1 border-none border-b border-dashed border-[#ccc] font-work-sans text-[1rem] outline-none bg-transparent text-[var(--border-color)] ${item.isDone ? 'line-through' : 'no-underline'} ${item.isDone || isReadOnly ? 'opacity-50' : 'opacity-100'}`}
      />
      {item.text.match(/!(\d{1,2})[.:](\d{2})/) && (
        <span className="shrink-0 ml-2" title="Scheduled Reminder">
          <AlarmClock size={16} strokeWidth={2.5} className="text-[var(--border-color)] opacity-70" />
        </span>
      )}
    </div>
  );
}
