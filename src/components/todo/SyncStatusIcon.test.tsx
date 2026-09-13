import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncStatusIcon } from './SyncStatusIcon';

describe('SyncStatusIcon', () => {
  it('should render dimmed saved icon when state is IDLE', () => {
    render(<SyncStatusIcon state="IDLE" />);
    expect(screen.getByTitle('Saved')).toBeInTheDocument();
    expect(screen.getByTitle('Saved')).toHaveStyle({ opacity: '0.5' });
  });

  it('should render spinning icon when state is SAVING', () => {
    render(<SyncStatusIcon state="SAVING" />);
    const savingIcon = screen.getByLabelText('Saving');
    expect(savingIcon).toBeInTheDocument();
    expect(savingIcon.querySelector('.animate-sync-spin')).toBeInTheDocument();
  });

  it('should render checkmark icon when state is SAVED', () => {
    render(<SyncStatusIcon state="SAVED" />);
    const savedIcon = screen.getByLabelText('Saved');
    expect(savedIcon).toBeInTheDocument();
    expect(savedIcon.querySelector('.animate-sync-pop')).toBeInTheDocument();
  });

  it('should render error icon when state is ERROR', () => {
    render(<SyncStatusIcon state="ERROR" />);
    const errorIcon = screen.getByLabelText('Sync error');
    expect(errorIcon).toBeInTheDocument();
    expect(errorIcon.querySelector('.animate-sync-pulse')).toBeInTheDocument();
  });
});

