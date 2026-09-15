# Dual Todo — Project Context

## What This Is
A shared to-do app for two people (Most & Fern). Brutalist UI, real-time sync, no accounts — PIN login only.

## Stack
| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| State | Zustand |
| Styling | Tailwind CSS v4 + daisyUI ("RawBlock" brutalist theme) |
| DB | Firebase Firestore (real-time `onSnapshot`) |
| Hosting | Vercel (static + `/api/cron/nightly` serverless) |
| PWA | vite-plugin-pwa |

## Data Model (Firestore)
- **`todos` collection** — Google Keep-style cards.
  - `title`, `isPinned`, `order` (drag-and-drop), `assignee` (most | fern | both).
  - `items[]` — `ChecklistItem` sub-tasks with `isDone`, `completedAt`, `completedBy`.
- **`dailySummaries` collection** — nightly cron snapshots (pending count, completed count per user).

## Source Map
```
src/
├── App.tsx                     # Root: auth gate, view routing (todo ↔ stats)
├── main.tsx                    # Vite entry
├── components/
│   ├── auth/LoginScreen.tsx    # PIN login (birthday-based)
│   ├── layout/MainLayout.tsx   # Header + logo click → stats toggle
│   ├── stats/StatsView.tsx     # Bar chart heatmap + MVP banner
│   └── todo/
│       ├── TodoList.tsx        # Board: pinned + others, dnd-kit sorting
│       ├── TodoCard.tsx        # Card preview (title, progress, assignee)
│       ├── CardModal.tsx       # Full card editor (auto-sync, debounced)
│       ├── SortableChecklistItem.tsx  # Draggable sub-task row
│       ├── AssigneeBadge.tsx   # M / F / M+F badge
│       ├── PinIcon.tsx         # 📌 toggle
│       └── SyncStatusIcon.tsx  # SAVED / SAVING / ERROR indicator
├── hooks/
│   └── useDebouncedCardSync.ts # 800ms debounce + serialized flush-on-close
├── services/
│   ├── firestoreService.ts     # CRUD + real-time subscriptions
│   └── discordService.ts       # Webhook notifications
├── store/
│   ├── authStore.ts            # PIN auth state
│   └── todoStore.ts            # Cards state + checklist mutations
├── types/
│   ├── todo.ts                 # CardItem, ChecklistItem, DailyStat, DailySummary
│   ├── auth.ts                 # AuthState
│   └── discord.ts              # Webhook payload types
├── utils/
│   └── dateFormat.ts           # Thai BE dates, Bangkok TZ, getLast30Days
├── styles/
│   ├── globals.css             # Tailwind + daisyUI + RawBlock utilities
│   └── variables.css           # CSS custom properties (colors, fonts, borders)
├── config/
│   └── firebase.ts             # Firebase init (long-polling mode)
└── test/
    └── setup.ts                # Vitest global setup
api/
├── cron/nightly.ts             # Vercel cron: fail-closed daily summary → Discord
└── discord/interactions.ts     # Signed Discord commands with freshness/input checks
```

## Design Rules
1. English only in UI text.
2. No parentheses in user-facing copy.
3. Brutalist: thick borders, high contrast, `Archivo Black` headings, `Space Mono` body.
4. Dark mode via `[data-theme="dark"]` — inverts `--border-color` and `--bg-color`.

## Features
- **Cards & Checklists** — Create, edit, pin, reorder (drag-and-drop via dnd-kit).
- **Auto-Sync** — 800ms debounced writes, flush on modal close / unmount.
- **Sync Recovery** — In-flight flushes are shared across close and unmount, load failures expose retry, and failed item moves restore the source list.
- **Lock Recovery** — Cards open read-only when lock acquisition fails.
- **Activity Heatmap** — 30-day bar chart computed client-side from `completedAt` timestamps.
- **MVP Banner** — Weekly leaderboard (7-day totals) shown at top of stats view.
- **Discord Notifications** — Per-item completion webhook + nightly summary cron.
- **PWA** — Installable, offline-capable shell.

## Operational Constraints
- Authentication remains client-side PIN login with local storage persistence by design.
- Firestore rules are currently permissive and must not be treated as an authorization boundary.
- Concurrent card edits remain last-write-wins; revision conflict detection and merge are deferred.
- Cron requests require `CRON_SECRET`; Discord interactions reject stale signatures and oversized checklist input.
- Verification baseline: `npm run build` passes; the current full suite has 42 passing tests and 3 existing Discord message-format expectation failures.

## Updated
2026-09-15
