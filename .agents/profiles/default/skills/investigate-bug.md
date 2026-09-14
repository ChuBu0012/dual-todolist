---
name: investigate-bug
trigger: >-
  Use when user reports a bug, error, crash, wrong behavior, failed build,
  or says "หาบัค", "debug", "ทำไมพัง", "investigate", "แก้ปัญหานี้".
---

# Investigate Bug Skill (v2 — Evidence First)

## Core Principle
NO FIX WITHOUT EVIDENCE. การเดาถูกห้ามเด็ดขาด
ทุกสมมติฐานต้องอ้าง file:line, บรรทัด log หรือผลการ reproduce ได้

## Step 0: Classify the Bug
- **Class A — LOCAL BEHAVIOR** (UI, DnD, animation, state, focus): → Verify Loop A
- **Class B — PRODUCTION/SERVER** (vercel.app, cron, webhook, Discord interactions, env): → Verify Loop B
- **Class C — BUILD/TYPE** (TS errors, build fail): → Verify Loop C

## Verify Loop A — Behavior Bugs
1. REPRODUCE: ใช้ /browser หรือ e2e บันทึกสิ่งที่เกิดจริง (console, DOM, network)
2. SPEC: เขียน test ที่ FAIL ซึ่ง encode พฤติกรรมที่คาดหวัง
3. HYPOTHESIZE: ผู้ต้องสงสัยไม่เกิน 3 ตัว แต่ละตัวระบุ file:line + เหตุผลจากหลักฐาน
4. FIX: เปลี่ยนแปลงน้อยที่สุด บน branch
5. RE-VERIFY: รัน test ที่เคย fail จนเขียว + /browser sanity pass
6. REPORT: หลักฐาน before/after

## Verify Loop B — Production Bugs
1. LOGS FIRST: `vercel logs <url>` หรือ Dashboard → Deployments → Functions ห้ามข้าม
2. REPRODUCE บน deployed URL ถ้าทำได้
3. MATCH กับ platform knowledge ใน skill `vercel-ops`
4. FIX บน branch + รัน `npm run build` โลคอลก่อน push
5. REDEPLOY แล้วดู log ยืนยันอีกครั้ง

## Verify Loop C — Build/Type Bugs
1. รันคำสั่งที่ fail ตรงๆ โลคอล (`npm run build`)
2. แก้ที่รากเหตุ — unused var ให้ "ลบออก" ไม่ใช่กด ignore
3. รันซ้ำจน exit 0

## Forbidden
- แก้โดยยังไม่ reproduce (Loop A) หรือยังไม่ดู log (Loop B)
- บอกว่า "เสร็จ" โดยไม่มีผลการ re-verify
- แตะไฟล์นอก SCOPE ที่ประกาศไว้
- ปัด error ว่าเป็น "ปัญหา environment" โดยไม่มีหลักฐาน

## Output Format
> 🔍 Investigation Report
> - Class: [A/B/C]
> - Evidence: [สิ่งที่สังเกตได้ + แหล่งที่มา]
> - Root cause: [file:line + คำอธิบาย]
> - Fix: [สิ่งที่เปลี่ยน]
> - Verification: [ผล test/log หลังแก้]