# FEATURE PLAN: Google Keep-Style Auto-Sync & Drag-and-Drop (dnd-kit)

## 🎯 Overview & Success Criteria
Transform the card interaction into a true Google Keep experience:
1. **Seamless Auto-Sync:**
   - Remove manual "CREATE" / "SAVE" buttons.
   - Changes sync to Firestore automatically with an 800ms debounce to conserve bandwidth.
   - Pending changes immediately flush when the modal closes, unmounts, or navigates away.
2. **Smooth Drag-and-Drop Reordering (`@dnd-kit`):**
   - Reorder cards within "📌 Pinned" and "Others" zones.
   - Mobile-friendly touch sensor with hold-to-drag activation constraints (prevents interfering with normal vertical scrolling).
   - Optimistic local reorder with instant feedback and background Firestore order persistence.

---

## 🏛️ Architecture & Data Flow

```text
[ User Edits in CardModal ]
           │
           ├─ Instant UI Update (Local State / React)
           │
           ├─ Debounce Timer (800ms) ───────────┐
           │                                    ▼
           ├─ Modal Close / Unmount Event ──> [ Flush Pending Changes ]
           │                                    │
           └────────────────────────────────────┼─> [ Firestore setDoc/updateDoc ]
                                                ▼
                                    [ Real-time Snapshot / Zustand ]

[ User Drags Card in TodoList ]
           │
           ├─ Pointer / Touch Sensor (delay: 200ms, tolerance: 5px)
           ├─ Optimistic local reorder in Zustand (arrayMove)
           └─ Persist updated order batch to Firestore
```

---

## 📋 Task Checklist

### Phase 1: Dependencies & Drag-and-Drop (`@dnd-kit`)
- [ ] **[Task 1.1]** Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`. `[dependencies]`
- [ ] **[Task 1.2]** Configure `DndContext` and `SortableContext` in `src/components/todo/TodoList.tsx`. `[react-state-management]`
- [ ] **[Task 1.3]** Wrap `TodoCard` with `useSortable` hook (`transform`, `transition`, `listeners`, `attributes`). `[ux_design]`
- [ ] **[Task 1.4]** Setup `TouchSensor` and `MouseSensor` with `activationConstraint: { delay: 200, tolerance: 5 }` so mobile scrolling remains smooth. `[mobile-ux]`
- [ ] **[Task 1.5]** Connect `onDragEnd` to `useTodoStore.getState().reorderCards(...)`. `[zustand-state-management]`

### Phase 2: Google Keep Style Auto-Sync & Flush Lifecycle
- [ ] **[Task 2.1]** Create `useDebouncedCardSync` hook: `[react-state-management]`
  - Manages dirty state and debounced sync (800ms).
  - Exposes `flush()` to immediately execute pending writes.
  - Registers `window.addEventListener('beforeunload', flush)`.
  - Performs `useEffect` cleanup to flush on component unmount.
- [ ] **[Task 2.2]** Refactor `CardModal.tsx`: `[ux_design]`
  - Remove bottom "SAVE" / "CREATE" buttons.
  - Add a subtle status indicator in header (e.g. `SAVED` / `SAVING...`).
  - Add simple "CLOSE" or back button that triggers `flush()` before closing.
  - Auto-create new card document upon typing the first character.
- [ ] **[Task 2.3]** Handle empty draft cleanup (if user opens new card and closes without typing anything, delete/skip creation). `[logic]`

### Phase 3: Mobile Spacing & Responsive Polish
- [ ] **[Task 3.1]** Adjust `CardModal` overlay and container margins on mobile (width: `calc(100% - 32px)`, padding: `16px`). `[ux_design]`
- [ ] **[Task 3.2]** Apply new Assignee Icon tokens based on UX Design report (replacing plain dots). `[ux_design]`

### Phase 4: Verification & Regression Testing
- [ ] **[Task 4.1]** Write unit tests in `src/store/todoStore.test.ts` for auto-sync and reorder logic. `[tester_engineer]`
- [ ] **[Task 4.2]** Verify build with `npm run build` and test with `npm run test:run`. `[tester_engineer]`

---

## ⚠️ Risk Assessment & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Data Loss on Quick Close** | High | Modal `onClose` calls `flush()` synchronously before dismissing; `useEffect` unmount triggers instant flush. |
| **Mobile Scroll Conflict with DnD** | Medium | Use `TouchSensor` with a 200ms delay & 5px movement tolerance. Requires deliberate hold-to-drag. |
| **Excessive Firestore Writes (Bandwidth)** | Medium | 800ms debounce ensures rapid keystrokes bundle into a single write request. |
| **Empty Ghost Cards** | Low | New cards only write to Firestore once `title.trim() !== ''` or first checklist item has text. |

---
*Reference: [PROJECT_CONTEXT.md](file:///Users/most-too/Desktop/dual_todolist/dual-todo/PROJECT_CONTEXT.md)*

