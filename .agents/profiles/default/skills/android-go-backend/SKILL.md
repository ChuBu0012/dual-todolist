---
name: android-go-backend
trigger: >-
  Use this skill when developing, deploying, or troubleshooting the custom Go Gin backend 
  hosted on the Android Termux environment, which handles task reminders, daily summaries, 
  and SQLite job queues.
---

# Android Go Backend (Termux) Workflow

## Purpose
แนวทางการพัฒนาและดูแลรักษาระบบ Backend ที่เขียนด้วย Go (Gin) ซึ่งรันอยู่บนมือถือ Android ผ่าน Termux เพื่อใช้แทน Firebase Cloud Functions และ Vercel Cron ในการจัดการแจ้งเตือนล่วงหน้าและสรุปผลรายวัน

## Architecture & Constraints
1. **Host Environment:** รันบน Android Termux
   - **ข้อควรระวัง:** ต้องเปิด `termux-wake-lock` และจัดการปิด Phantom Process Killer (ผ่าน ADB) ให้เรียบร้อย เพื่อป้องกัน OS ฆ่า Process ทิ้งเวลาจอดับ
2. **Network Exposure:** ใช้ Cloudflare Tunnel (`cloudflared`)
   - เปิดให้ Frontend เข้าถึง Go Server ได้ผ่าน Domain ของ Cloudflare โดยตรง (เสถียรและ URL ไม่เปลี่ยน)
3. **Data Flow (Frontend ➡️ Go API):** 
   - Frontend จะเป็นคนส่ง HTTP Request (POST/DELETE) มาหา Go Server เองทุกครั้งที่มีการสร้าง/ลบ Task ที่มีเวลา เพื่อให้ Go บันทึกลงคิว (ไม่ใช้ Firestore Snapshot Listener เพื่อลดภาระเครื่องมือถือ)
4. **Queue Storage:** เก็บข้อมูลคิวลง SQLite
   - เพื่อป้องกันข้อมูลสูญหายเมื่อมือถือแบตหมดหรือแอพแครช คิวทั้งหมดจะถูกบันทึกรูปลงไฟล์ SQLite แบบ Local
5. **Execution Trigger:** ใช้ Go Ticker & Cron
   - รัน Ticker (Loop) ทุกๆ นาที เพื่อเช็ค SQLite ว่าถึงเวลาส่งแจ้งเตือน Discord (30, 20, 10, 5 นาที) หรือยัง
   - รัน Cron (เช่น `robfig/cron/v3`) เพื่อดึงยอดจาก Firestore มาสรุปรายวันตอนเที่ยงคืนตรง (GMT+7)

## Guidelines for Implementation
เมื่อถูกสั่งให้เขียนโค้ดสำหรับโปรเจกต์นี้ ให้ยึดหลักการดังนี้:

1. **Lightweight First:** เลือกใช้ไลบรารีที่เบาที่สุดเสมอ หลีกเลี่ยง Redis/RabbitMQ ใช้แค่ SQLite ก็พอสำหรับงานสเกลระดับ Personal
2. **Crash Resilience:** โค้ดที่รัน Ticker ต้องมี Error Handling ที่ดี ห้าม Panic จน Server ดับ และเมื่อเปิด Server ใหม่ ต้องโหลดคิวค้างเก่าจาก SQLite ขึ้นมาทำต่อได้ทันที
3. **Timezone Explicit:** ระบุ Timezone ของ Cron เป็น `Asia/Bangkok` (GMT+7) เสมอ ป้องกันปัญหามือถือตั้ง Timezone ผิด
4. **Graceful Shutdown:** ดักจับ Signal (SIGINT/SIGTERM) ให้ปิด Connection ของ SQLite และรอให้ Ticker ทำงานรอบปัจจุบันเสร็จก่อนปิดแอปเสมอ
