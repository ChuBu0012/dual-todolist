# Dual Todo Project Context

## App Architecture
**Name:** Dual Todo
**Framework:** React 18, TypeScript, Vite
**State Management:** Zustand
**Styling:** Tailwind CSS + daisyUI (Brutalist "RawBlock" Theme)
**Backend/DB:** Firebase Firestore
**PWA:** vite-plugin-pwa

## Data Architecture (Google Keep Style)
- A single board containing Cards (`TodoCard`).
- **Cards (`todos` collection in Firestore):**
  - Have a `title`, `isPinned` (boolean), and an `order` for drag/drop.
  - Contain an array of `items` (`ChecklistItem`).
  - Assignee (`most`, `fern`, or `both`) is set at the card level.
- **Checklist Items (`ChecklistItem`):**
  - Belong to a Card.
  - Can be toggled `isDone`.
  - Strikethrough style when checked.
  - Discord notifications fire per checklist item completion.

## Design Rules
1. English ONLY in UI text.
2. NO parentheses (e.g. `(Title)` is not allowed).
3. Design is brutalist: thick black borders (`3px solid #000`), `#fff` backgrounds, high contrast.
4. Icons: `●` for Most, `○` for Fern. No text for user names on cards.

## Recent Updates
- [SYNCED: 2026-09-12] Migrated from flat tasks to Google Keep style cards.
- [SYNCED: 2026-09-12] Updated Zustand Store and Firestore schema.
- [SYNCED: 2026-09-12] Moved PIN configurations from code to `.env` variables.
