import { describe, it, expect } from 'vitest';
import {
  extractTags,
  extractCardTags,
  getAllTagsWithCounts,
  cardMatchesTag,
} from './tagUtils';
import type { CardItem } from '../types/todo';

describe('tagUtils', () => {
  describe('extractTags', () => {
    it('should return empty array for empty or null text', () => {
      expect(extractTags('')).toEqual([]);
      expect(extractTags(null)).toEqual([]);
      expect(extractTags(undefined)).toEqual([]);
    });

    it('should extract English tags and normalize to lowercase', () => {
      const text = 'Meeting with #Team about #PROJECT_1 and #Urgent-Task';
      expect(extractTags(text)).toEqual(['#team', '#project_1', '#urgent-task']);
    });

    it('should extract Thai tags', () => {
      const text = 'ซื้อของเข้า #บ้าน และจ่ายค่า #ไฟ';
      expect(extractTags(text)).toEqual(['#บ้าน', '#ไฟ']);
    });

    it('should deduplicate multiple occurrences of the same tag', () => {
      const text = '#work #WORK #Work review';
      expect(extractTags(text)).toEqual(['#work']);
    });
  });

  describe('extractCardTags', () => {
    it('should extract tags from both title and items', () => {
      const card: Partial<CardItem> = {
        title: 'Sprint Planning #Work',
        items: [
          { id: '1', text: 'Prepare slides #urgent', isDone: false },
          { id: '2', text: 'Call client #work', isDone: true },
        ],
      };

      const tags = extractCardTags(card);
      expect(tags).toContain('#work');
      expect(tags).toContain('#urgent');
      expect(tags).toHaveLength(2);
    });
  });

  describe('getAllTagsWithCounts', () => {
    const cards: CardItem[] = [
      {
        id: '1',
        title: 'Card 1 #dev #urgent',
        assignee: 'most',
        isPinned: false,
        isArchived: false,
        order: 0,
        items: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        title: 'Card 2 #dev',
        assignee: 'fern',
        isPinned: false,
        isArchived: false,
        order: 1,
        items: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        title: 'Card 3 #archived #dev',
        assignee: 'both',
        isPinned: false,
        isArchived: true,
        order: 2,
        items: [],
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('should aggregate tags excluding archived by default', () => {
      const counts = getAllTagsWithCounts(cards);
      expect(counts).toEqual([
        { tag: '#dev', count: 2 },
        { tag: '#urgent', count: 1 },
      ]);
    });

    it('should include archived when includeArchived is true', () => {
      const counts = getAllTagsWithCounts(cards, { includeArchived: true });
      expect(counts).toEqual([
        { tag: '#dev', count: 3 },
        { tag: '#archived', count: 1 },
        { tag: '#urgent', count: 1 },
      ]);
    });
  });

  describe('cardMatchesTag', () => {
    const card: CardItem = {
      id: '1',
      title: 'Dev Tasks #work',
      assignee: 'most',
      isPinned: false,
      order: 0,
      items: [{ id: '1', text: 'Fix bug #frontend', isDone: false }],
      createdAt: '',
      updatedAt: '',
    };

    it('should match ALL or null as true', () => {
      expect(cardMatchesTag(card, null)).toBe(true);
      expect(cardMatchesTag(card, 'ALL')).toBe(true);
      expect(cardMatchesTag(card, '')).toBe(true);
    });

    it('should match existing tags case-insensitively', () => {
      expect(cardMatchesTag(card, '#work')).toBe(true);
      expect(cardMatchesTag(card, '#WORK')).toBe(true);
      expect(cardMatchesTag(card, '#frontend')).toBe(true);
    });

    it('should return false for non-matching tags', () => {
      expect(cardMatchesTag(card, '#backend')).toBe(false);
    });
  });
});
