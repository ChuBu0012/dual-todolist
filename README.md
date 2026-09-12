# Dual Todo

A shared, brutalist-style checklist app for couples, built with React, Vite, and Firebase.

## Features
- **Google Keep-Style Board:** Organize lists into Cards.
- **Pinning & Reordering:** Pin important cards and drag-to-reorder.
- **Shared Access:** Tag cards for 'most', 'fern', or 'both'.
- **Checklist Items:** Add multiple sub-tasks per card.
- **Discord Integration:** Sends notifications when items are checked off.
- **PWA:** Installable as an app.

## Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and fill in the values:
   - `VITE_PIN_MOST`
   - `VITE_PIN_FERN`
   - `VITE_DISCORD_WEBHOOK_URL`
   - Firebase Config variables

3. **Run Dev Server**
   ```bash
   npm run dev
   ```

4. **Testing**
   ```bash
   npm run test:run
   ```

## Tech Stack
- React 18
- TypeScript
- Vite
- Zustand
- TailwindCSS + daisyUI
- Firebase Firestore

[SYNCED: 2026-09-12]
