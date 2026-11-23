import type { CardItem } from '../types/todo';

/**
 * Regex for matching hashtags supporting Unicode letters (including Thai), combining marks (vowels & tone marks), numbers, underscores, and hyphens.
 * Example: #work, #urgent, #บ้าน, #todo-1
 */
const HASHTAG_REGEX = /#([\p{L}\p{M}\p{N}_-]+)/gu;

/**
 * Extracts unique normalized (lowercase) tags with '#' prefix from a string.
 */
export function extractTags(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];

  const unique = new Set<string>();
  for (const match of matches) {
    unique.add(match.toLowerCase());
  }
  return Array.from(unique);
}

/**
 * Extracts unique tags across a card's title and its checklist items.
 */
export function extractCardTags(card: Partial<CardItem>): string[] {
  const tags = new Set<string>();

  if (card.title) {
    extractTags(card.title).forEach((t) => tags.add(t));
  }

  if (card.items && Array.isArray(card.items)) {
    for (const item of card.items) {
      if (item?.text) {
        extractTags(item.text).forEach((t) => tags.add(t));
      }
    }
  }

  return Array.from(tags);
}

/**
 * Aggregates all unique tags from a list of cards with their occurrences,
 * sorted by count descending, then alphabetical.
 */
export function getAllTagsWithCounts(
  cards: CardItem[],
  options?: { includeArchived?: boolean }
): { tag: string; count: number }[] {
  const countMap = new Map<string, number>();

  for (const card of cards) {
    if (!options?.includeArchived && card.isArchived) continue;

    const cardTags = extractCardTags(card);
    for (const tag of cardTags) {
      countMap.set(tag, (countMap.get(tag) || 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Checks whether a card contains a specific tag (case-insensitive).
 */
export function cardMatchesTag(card: CardItem, tag: string | null): boolean {
  if (!tag || tag === 'ALL') return true;
  const normalizedTag = tag.toLowerCase();
  const cardTags = extractCardTags(card);
  return cardTags.includes(normalizedTag);
}
