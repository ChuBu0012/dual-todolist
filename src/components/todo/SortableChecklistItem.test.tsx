import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortableChecklistItem } from './SortableChecklistItem';

// Mock dnd-kit hooks since they require context to run properly
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

describe('SortableChecklistItem', () => {
  const mockItem = {
    id: 'item-1',
    text: 'Test Task',
    isDone: false,
  };

  it('should render correctly', () => {
    render(
      <SortableChecklistItem
        item={mockItem}
        isReadOnly={false}
        isPending={false}
        onToggle={vi.fn()}
        onChangeText={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
  });

  it('should call onToggle when clicking the checkbox', async () => {
    const toggleSpy = vi.fn();
    render(
      <SortableChecklistItem
        item={mockItem}
        isReadOnly={false}
        isPending={false}
        onToggle={toggleSpy}
        onChangeText={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await fireEvent.click(checkbox);
    
    expect(toggleSpy).toHaveBeenCalledWith('item-1');
  });

  it('should trigger onEnter when pressing Enter key', async () => {
    const enterSpy = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SortableChecklistItem
        item={mockItem}
        isReadOnly={false}
        isPending={false}
        onToggle={vi.fn()}
        onChangeText={vi.fn()}
        onRemove={vi.fn()}
        onEnter={enterSpy}
      />
    );
    
    const input = screen.getByDisplayValue('Test Task');
    await user.click(input);
    await user.keyboard('{Enter}');
    
    expect(enterSpy).toHaveBeenCalled();
  });

  it('should apply autoFocus property to the input', () => {
    render(
      <SortableChecklistItem
        item={mockItem}
        isReadOnly={false}
        isPending={false}
        onToggle={vi.fn()}
        onChangeText={vi.fn()}
        onRemove={vi.fn()}
        autoFocus={true}
      />
    );
    
    const input = screen.getByDisplayValue('Test Task');
    expect(input).toHaveFocus();
  });
});
