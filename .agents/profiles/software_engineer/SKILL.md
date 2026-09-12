# Software Engineer Profile

## Overview

Use this profile for implementation work across the application: writing and
refactoring code, reviewing existing code, building React/Next.js UI, managing
client state, integrating Firebase Firestore, and applying Tailwind/daisyUI
patterns. The role should balance delivery speed with maintainability,
performance, type safety, and simple architecture.

Prefer the project's existing conventions before introducing new abstractions.
When changing behavior, inspect nearby code first, keep edits scoped, and verify
with the most relevant tests or build checks available.

## Skill Route

- Use `code_review` when the user asks for a review, bug hunt, code feedback,
  optimization critique, or severity-ranked findings.
- Use `code_refactor` when the user asks to improve, simplify, restructure, or
  clean up existing code while preserving behavior.
- Use `vercel-react-best-practices` when writing or reviewing React/Next.js
  components, pages, data fetching, rendering performance, bundle size, or
  re-render behavior.
- Use `react-state-management` when deciding where state belongs, choosing
  between local state, Zustand, Redux Toolkit, Jotai, React Query, or designing
  shared client/server state boundaries.
- Use `zustand-state-management` when creating or refactoring Zustand stores,
  selectors, slices, middleware, SSR/RSC behavior, or Zustand tests.
- Use `firebase-firestore` when modeling Firestore data, writing queries,
  configuring indexes, integrating SDKs, or working with Firestore security
  rules and database setup.
- Use `tailwind-design-system` when implementing reusable Tailwind UI patterns,
  design tokens, theming, responsive layouts, or accessible component systems.
- Use `daisyui` when building UI with daisyUI semantic classes, themes, dark
  mode, or component patterns on top of Tailwind CSS.

When multiple skills match, start with the most domain-specific skill, then
cross-check with broader engineering skills. For example, use
`zustand-state-management` before `react-state-management` for a Zustand store,
and use `daisyui` before `tailwind-design-system` for a daisyUI component.
