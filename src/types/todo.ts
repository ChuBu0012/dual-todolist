export type UserRole = 'most' | 'fern';
export type TodoAssignee = 'most' | 'fern' | 'both';

export interface ChecklistItem {
  id: string; // generated client-side (uuid or timestamp)
  text: string;
  isDone: boolean;
  completedAt?: string | null;
  completedBy?: 'most' | 'fern' | null;
}

/**
 * Card document structure matching Firestore collection 'todos' (now representing a Google Keep style card)
 */
export interface CardItem {
  id: string;
  title: string;
  isPinned: boolean;
  order: number; // For manual sorting (lower = higher on list)
  assignee: TodoAssignee;
  items: ChecklistItem[]; // Array of sub-tasks

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Concurrency Lock
  lockedBy?: string | null;
  lockedAt?: string | null;
}

/**
 * Daily summary structure matching Firestore collection 'dailySummaries'
 */
export interface DailySummary {
  date: string; // Document ID: 'YYYY-MM-DD'
  totalTodos: number;
  completedTodos: number;
  mostCompleted: number;
  fernCompleted: number;
  pendingTodos: string[];
}

/**
 * Completed task log structure matching Firestore collection 'completedTasks'
 * Used for 30-minute interval batch notifications to Discord
 */
export interface CompletedTaskLog {
  id: string;
  cardId: string;
  cardTitle: string;
  itemId: string;
  itemText: string;
  completedBy: 'most' | 'fern';
  completedAt: string;
  dateStr: string;
  notified: boolean;
  notifiedAt?: string | null;
}
