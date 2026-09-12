import { useRef, useCallback, useEffect } from 'react';

interface LongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // ms
}

/**
 * Returns pointer event handlers for long-press detection.
 * Single tap calls onClick; hold >= threshold calls onLongPress.
 */
export function useLongPress({ onLongPress, onClick, threshold = 500 }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Only primary pointer (ignore multitouch on same element)
      if (e.pointerType === 'touch') e.preventDefault();
      didLongPress.current = false;
      timerRef.current = setTimeout(() => {
        didLongPress.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    cancel();
    if (!didLongPress.current && onClick) {
      onClick();
    }
  }, [cancel, onClick]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}

