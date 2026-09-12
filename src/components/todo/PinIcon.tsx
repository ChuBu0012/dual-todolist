interface Props {
  isPinned?: boolean;
  size?: number;
  color?: string;
}

export function PinIcon({ isPinned = false, size = 18, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isPinned ? color : 'none'}
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Brutalist technical pushpin */}
      <path d="M16 12V4h1V2H7v2h1v8l-2 3v2h5v5l1 1 1-1v-5h5v-2l-2-3z" />
    </svg>
  );
}

