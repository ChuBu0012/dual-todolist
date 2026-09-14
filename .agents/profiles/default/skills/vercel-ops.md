---
name: vercel-ops
trigger: >-
  Use when a bug appears on the deployed URL (vercel.app), or involves
  cron jobs, webhooks, Discord interactions endpoint, env vars,
  serverless build failures, or when user says "ดู log", "deploy",
  "production พัง", "cron ไม่ทำงาน".
---

# Vercel Ops Skill

## Platform Knowledge (จำขึ้นใจ)
- Client-side env ต้องขึ้นต้น `VITE_` เท่านั้น / serverless (`api/`) ใช้ชื่อธรรมดา
- `api/` รันเป็น Node ESM: relative import ต้องมีนามสกุล `.js` ชัดเจน
- Hobby plan: cron จำกัด 1 ครั้ง/วัน
- แก้ env แล้วต้อง REDEPLOY จึงมีผล
- Firestore env หายจะแสดงเป็น `projects//databases` (project id ว่าง) ใน error
- Log: `vercel logs <deployment-url>` หรือ Dashboard → Deployments → Functions
- Discord interactions endpoint ต้องตอบ PING (type 1) ด้วย PONG (type 2) ไม่งั้น verification fail

## Steps (ห้ามสลับลำดับ)
1. Reproduce บน deployed URL (ไม่ใช่ localhost)
2. ดึง server log ก่อนเสมอ
3. แมป error เข้า Platform Knowledge ข้างบน
4. แก้บน branch + รัน `npm run build` โลคอล (Vercel รันตัวเดียวกัน)
5. Redeploy → ดู log ยืนยัน
6. Report: log excerpt ก่อน + หลังแก้

## Permissions
- ไม่ต้องถาม: `vercel logs`, `vercel env ls`, เปิด dashboard ผ่าน /browser
- ต้องถามก่อน: `vercel env add/rm`, redeploy production นอก flow ปกติ