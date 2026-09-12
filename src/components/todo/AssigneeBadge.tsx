import type { TodoAssignee } from '../../types/todo';

interface Props {
  assignee: TodoAssignee;
  size?: 'small' | 'medium';
}

export function AssigneeBadge({ assignee, size = 'small' }: Props) {
  const isSmall = size === 'small';
  const fontSize = isSmall ? '0.7rem' : '0.8rem';
  const height = isSmall ? '20px' : '28px';

  if (assignee === 'both') {
    return (
      <div
        style={{
          display: 'inline-flex',
          border: '2px solid var(--border-color)',
          height,
          userSelect: 'none',
          boxSizing: 'border-box',
        }}
        title="Assignee: Both Most and Fern"
      >
        <span
          style={{
            backgroundColor: 'var(--border-color)',
            color: 'var(--card-bg)',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            fontSize,
            padding: '0 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid var(--card-bg)',
          }}
        >
          M
        </span>
        <span
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--border-color)',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            fontSize,
            padding: '0 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          F
        </span>
      </div>
    );
  }

  const isMost = assignee === 'most';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid var(--border-color)',
        height,
        padding: '0 7px',
        backgroundColor: isMost ? 'var(--border-color)' : 'var(--card-bg)',
        color: isMost ? 'var(--card-bg)' : 'var(--border-color)',
        fontFamily: 'Space Mono, monospace',
        fontWeight: 700,
        fontSize,
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
      title={`Assignee: ${isMost ? 'Most' : 'Fern'}`}
    >
      {isMost ? 'M' : 'F'}
    </div>
  );
}

