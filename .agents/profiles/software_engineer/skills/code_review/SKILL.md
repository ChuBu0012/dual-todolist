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
## Output Contract (บังคับทุก review)
- ผล review = รายการ findings เท่านั้น รูปแบบ:
  `- [🔴/🟡/🟢] file:line — ปัญหา — ทำไมสำคัญ — ข้อแนะนำ`
- ห้ามแปะโค้ดเต็มไฟล์หรือโค้ดบล็อกใหญ่ในแชทเด็ดขาด
  (โค้ดในแชทจะปนกับ edit จริง ทำให้ flow Accept พังและโค้ดซ้ำทับกัน)
- Refactor ที่ได้รับอนุมัติ: apply เป็น step แยก ผ่าน write_file
  ทีละไฟล์ และ read_file จากดิสก์ก่อนเขียนทุกครั้ง
- ปิดท้ายทุก review ด้วย:
  - Lightweight Score (1-10)
  - คำสั่ง verification ที่ต้องรัน (เช่น `npm run build && npm test`)
- Unused import/var/type ทุกตัว = อย่างต่ำ 🟡 ต้อง flag เสมอ