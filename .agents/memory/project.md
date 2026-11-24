# Project: Dual Todo

## Purpose & Overview
Collaborative Brutalist daily todo list and note system for Most & Fern.
Built with React, TypeScript, Tailwind CSS, Vite, Firestore (Google Cloud), and deployed on Vercel.

## Current State
- **Active Production:** Deployed on Vercel at `https://dual-todo.vercel.app`.
- **Scheduled Cron:** External Android Termux (`v11`) cron checking `/api/reminders/check` every minute.
- **Card Archive System (Completed 2026-11-24):**
  - Cards support `isArchived: boolean` and `archivedAt: string`.
  - Archived cards are excluded from the main board and reminder cron alerts.
  - Collapsible `ARCHIVED CARDS (N)` section at the bottom of `TodoList`.
  - Manual Archive toggle button in `CardModal`.
- **Tags & Category Filters (Completed 2026-11-24):**
  - Inline `#hashtag` syntax in card title and checklist items (supports Thai and English).
  - Horizontal Tag Filter Chip bar under Search Bar with dynamic counts.
- **Hold-to-Delete Card (Completed 2026-11-24):**
  - 500ms long-press on close button (`✕`) in `CardModal` opens Brutalist delete confirmation dialog with haptics.
- **Reliability & Consistency Fixes (Completed 2026-11-24):**
  - Write-first execution for reminders in `api/reminders/check.ts` prevents duplicate Discord messages on Firestore write failure.
  - Cancel Discord timer and rollback optimistic checklist state when Firestore write fails in `src/store/todoStore.ts`.
  - Added `getBangkokTomorrow()` in `src/utils/dateFormat.ts` used by `/next` command in `api/discord/interactions.ts` to prevent UTC/Bangkok midnight date drift.

## Architecture & Decisions
- [Decision 2026-11-23] `!HH.MM` (exact) and `!!HH.MM` (15m advance) inline syntax in checklist items for reminders.
- [Decision 2026-11-24] Inline `#tag` extraction over explicit Firestore fields to keep schema minimal and zero-bloat.
- [Decision 2026-11-24] Archived cards skip cron evaluation in `api/reminders/check.ts`.
- [Decision 2026-11-24] Long-press hold-to-delete card prevents accidental deletions.
- [Decision 2026-11-24] Write-first reminder execution in `api/reminders/check.ts` to prevent duplicate notification bursts.
- [Decision 2026-11-24] Rollback optimistic state and clear Discord timer on Firestore write failure in `todoStore.ts`.
- [Decision 2026-11-24] Use `getBangkokTomorrow()` in `dateFormat.ts` for `/next` Discord command to guarantee exact Bangkok calendar offset.
