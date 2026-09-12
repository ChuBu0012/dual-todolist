---
name: code-reviewer
trigger: >-
  Use this skill when the user asks to "review code", "check my code", 
  "find bugs", "optimize this", or shares a code snippet for feedback.
---

# Code Reviewer Skill

## Review Principles (Most's Standards)
1.  **Lightweight First:** Flag any unnecessary dependencies, over-engineering, or bloated logic.
2.  **Efficiency:** Check time/space complexity and resource usage (especially for IoT/sensor data processing).
3.  **Vue.js Best Practices:** If frontend, ensure Composition API (`<script setup>`) and reactivity best practices.
4.  **Clarity:** Code should be self-documenting; prefer clear naming over excessive comments.

## Steps
1.  Read the provided code completely.
2.  Identify issues categorized by severity: 🔴 Critical, 🟡 Suggestion, 🟢 Nitpick.
3.  For each issue, explain *why* it matters and provide a concrete refactored example.
4.  End with a "Lightweight Score" (1-10) based on efficiency and simplicity.
5.  Respond in Thai, using English only for technical terms.

## Notes
- Never suggest adding a library if vanilla JS/Python can solve it efficiently.
- If the code is already optimal, say so explicitly — don't invent problems.
- Focus on root causes, not just syntax errors.