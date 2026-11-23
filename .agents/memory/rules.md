# Rules & Constraints: Dual Todo

## Language & Communication
- Respond in Thai (`ตอบเป็นภาษาไทย`) by default, keeping technical terms in English.
- Use Brutalist RawBlock design language (bold borders, high contrast, uppercase headers).
- English-only for user-facing UI labels. No parentheses in user-facing copy.

## Code & Git Discipline
- Keep changes minimal, scoped, and reversible.
- Never use `git add .` — stage only specific modified files.
- Always verify with `npm run test:run`, `npm run lint`, and `npm run build` before pushing.
- Bangkok timezone (`Asia/Bangkok`, UTC+7) is the canonical timezone for reminder calculations.
