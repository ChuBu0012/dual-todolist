export type SyncState = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

interface Props {
  state: SyncState;
}

export function SyncStatusIcon({ state }: Props) {

  if (state === 'SAVING') {
    return (
      <span
        title="Saving..."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
        }}
        aria-label="Saving"
      >
        <svg
          className="animate-sync-spin"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          style={{ display: 'block' }}
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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
        }}
        aria-label="Saved"
      >
        <svg
          className="animate-sync-pop"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="square"
          style={{ display: 'block' }}
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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
        }}
        aria-label="Sync error"
      >
        <svg
          className="animate-sync-pulse"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="square"
          style={{ display: 'block' }}
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
    );
  }

  return null;
}

