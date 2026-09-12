# PROJECT_CONTEXT.md

## Tech Stack & Tools
- **Frontend Framework:** React 18+ with TypeScript
- **State Management:** Zustand (Lightweight, no boilerplate)
- **Styling:** TailwindCSS + DaisyUI (Utility-first + Pre-built components)
- **Backend / Database:** Firebase Firestore (NoSQL, Real-time sync)
- **Build Tool:** Vite (Fast HMR, optimized bundles)
- **Linting/Formatting:** OXLint + Prettier + pre-commit hook

## 🎯 Project Goal
Realtime update todolist and notification in discord for 2 users.
- **Key Focus:** Daily and Persistent Todolist, Notification in Discord
- **UX Requirement:** Cute UI, easy-to-use, smooth interaction

## ⚠️ Key Constraints
- **Lightweight First:** Prefer Zustand over Redux; avoid heavy libraries.
- **Discord Integration:** Use Webhooks or Bot API efficiently; handle rate limits gracefully.
- **Firestore Security:** Implement strict rules; never expose raw DB access to clients.
- **PWA & Offline First:** 
  - Must support offline usage via Service Worker + IndexedDB/local cache.
  - Sync to Firestore automatically when online; handle conflicts gracefully.
  - Use `vite-plugin-pwa` or similar lightweight solution.

## Project Structure
public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── index.html
│
├── src/
│   ├── assets/                  # Static assets
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   │
│   ├── components/               # Reusable, UI components
│   │   ├── common/               # Buttons, Inputs, Modals, etc.
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.module.css
│   │   │   │   ├── Button.test.jsx
│   │   │   │   └── index.js
│   │   │   └── Modal/
│   │   └── layout/               # Header, Footer, Sidebar, Navbar
│   │       ├── Header/
│   │       └── Footer/
│   │
│   ├── features/                 # Feature-based modules (recommended for scale)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/         # API calls specific to auth
│   │   │   ├── authSlice.js      # Redux slice / Zustand store
│   │   │   └── index.js
│   │   ├── dashboard/
│   │   └── profile/
│   │
│   ├── pages/                    # Route-level components / views
│   │   ├── Home/
│   │   │   ├── Home.jsx
│   │   │   └── Home.module.css
│   │   ├── About/
│   │   └── NotFound/
│   │
│   ├── routes/                   # Routing configuration
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── hooks/                    # Global/shared custom hooks
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   └── useFetch.js
│   │
│   ├── context/                  # React Context providers
│   │   ├── ThemeContext.jsx
│   │   └── AuthContext.jsx
│   │
│   ├── store/                    # Global state management (Redux/Zustand/Recoil)
│   │   ├── index.js
│   │   └── slices/
│   │
│   ├── services/                 # API/axios instances, external service logic
│   │   ├── api.js                # Axios instance/config
│   │   ├── authService.js
│   │   └── userService.js
│   │
│   ├── utils/                    # Helper/utility functions
│   │   ├── formatDate.js
│   │   ├── validators.js
│   │   └── constants.js
│   │
│   ├── types/                    # TypeScript types/interfaces (if using TS)
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   │
│   ├── styles/                   # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── theme.js              # If using styled-components/MUI theme
│   │
│   ├── config/                   # App-level configuration
│   │   ├── env.js
│   │   └── appConfig.js
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx                  # Entry point (Vite) / index.js (CRA)
│   └── index.css
│
├── tests/                        # Global/integration tests (if not colocated)
│
├── .env
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── vite.config.js
└── README.md