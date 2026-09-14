type SyncState = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

interface Props {
  state: SyncState;
}

export function SyncStatusIcon({ state }: Props) {

  if (state === 'SAVING') {
    return (
      <span
        title="Saving..."
        className="inline-flex items-center justify-center text-[var(--fg-color)]"
        aria-label="Saving"
      >
        <svg
          className="animate-sync-spin block"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeLinecap="square" />
        </svg>
      </span>
    );
  }

  if (state === 'SAVED') {
    return (
      <span
        key="saved-icon"
        title="Saved"
        className="inline-flex items-center justify-center text-[var(--fg-color)]"
        aria-label="Saved"
      >
        <svg
          className="animate-sync-pop block"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="square"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    );
  }

  if (state === 'ERROR') {
    return (
      <span
        title="Sync error"
        className="inline-flex items-center justify-center text-[var(--error-text)]"
        aria-label="Sync error"
      >
        <svg
          className="animate-sync-pulse block"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="square"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
    );
  }

  return (
    <span
      key="idle-icon"
      title="Saved"
      className="inline-flex items-center justify-center text-[var(--fg-color)] opacity-50"
      aria-label="Saved"
    >
      <svg
        className="block"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

