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
        className={`inline-flex border-2 border-[var(--border-color)] select-none box-border ${isSmall ? 'h-[20px]' : 'h-[28px]'}`}
        title="Assignee: Both Most and Fern"
      >
        <span
          className="bg-[var(--border-color)] text-[var(--card-bg)] mono font-bold px-[6px] flex items-center justify-center border-r border-[var(--card-bg)]"
          style={{ fontSize }}
        >
          M
        </span>
        <span
          className="bg-[var(--card-bg)] text-[var(--border-color)] mono font-bold px-[6px] flex items-center justify-center"
          style={{ fontSize }}
        >
          F
        </span>
      </div>
    );
  }

  const isMost = assignee === 'most';

  return (
    <div
      className={`inline-flex items-center justify-center border-2 border-[var(--border-color)] px-[7px] mono font-bold select-none box-border ${isSmall ? 'h-[20px]' : 'h-[28px]'} ${isMost ? 'bg-[var(--border-color)] text-[var(--card-bg)]' : 'bg-[var(--card-bg)] text-[var(--border-color)]'}`}
      style={{ fontSize }}
      title={`Assignee: ${isMost ? 'Most' : 'Fern'}`}
    >
      {isMost ? 'M' : 'F'}
    </div>
  );
}

