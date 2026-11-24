---
name: dual-todo-insights
description: >
  ดึงข้อมูลทั้งหมดจาก Cloud Firestore ของ Dual Todo, วิเคราะห์สถิติและพฤติกรรมเชิงลึก (Deep Insights),
  สรุปรายงานผู้บริหารเป็นภาษาไทย และสร้าง/อัปเดตหน้า Static Analytics Dashboard (Chart.js)
trigger: >
  ใช้เมื่อผู้ใช้สั่ง "สรุป insight", "วิเคราะห์ database", "dashboard สถิติ", "ความคืบหน้าตั้งแต่เริ่มต้น",
  "dual-todo insights", "analytics report", "สรุปข้อมูลให้หน่อย", หรือต้องการดูภาพรวมพฤติกรรมการทำงานของ Most & Fern
license: MIT
---

# Dual Todo Insights & Analytics Skill

สกิลสำหรับ AI Agent ในการวิเคราะห์ข้อมูลทั้งหมดจาก Cloud Firestore ของโปรเจกต์ Dual Todo และสร้างรายงานสรุปเชิงลึก (Executive Insights) พร้อมหน้า Static Dashboard สำหรับวิเคราะห์ผลลัพธ์ย้อนหลัง

---

## 🛠️ ขั้นตอนการทำงานของ Agent (Execution Loop)

```
[1. Check Env] ➔ [2. Extract & Compute] ➔ [3. Formulate Insights] ➔ [4. Build Dashboard] ➔ [5. Report]
```

### ขั้นตอนที่ 1: ตรวจสอบ Environment & Security
1. ตรวจสอบว่ามีไฟล์ `.env` ในโฟลเดอร์ `dual-todo/` พร้อมตัวแปร Firebase (`VITE_FIREBASE_PROJECT_ID` หรือ `FIREBASE_PROJECT_ID`)
2. **กฎความปลอดภัย:** ห้ามพิมพ์ (echo/print) ค่า Secret หรือ Content ของ `.env` ออกมาในแชทเด็ดขาด

### ขั้นตอนที่ 2: ดึงข้อมูลและประมวลผลสถิติ (Extract & Compute)
รันสคริปต์อัตโนมัติ `scripts/export-insights.mjs`:
```bash
cd dual-todo && node --env-file=.env scripts/export-insights.mjs
```
สคริปต์นี้จะ:
- เชื่อมต่อ Cloud Firestore อ่าน collection `todos` ทั้งหมด 93+ ใบ
- วิเคราะห์ข้อมูล 7 มิติสำคัญ:
  1. **Core KPIs:** จำนวนการ์ด, งานทั้งหมด, งานที่เสร็จ, งานค้าง, อัตราความสำเร็จ (%)
  2. **Monthly Breakdown:** สถิติรายเดือน (ก.ย., ต.ค., พ.ย.)
  3. **Collaboration Distribution:** สัดส่วน Most vs Fern (การเป็นเจ้าของการ์ด และงานที่เคลียร์เสร็จ)
  4. **Temporal Patterns:** ชั่วโมงที่เคลียร์งานเยอะที่สุด (Bangkok UTC+7) และวันในสัปดาห์ (Day of Week)
  5. **Top Productive Days:** 10 วันที่มีสถิติเคลียร์งานสูงสุด
  6. **Recurring Habits:** กิจวัตรและคำที่ทำซ้ำบ่อยที่สุด (เช่น ออกกำลังกาย, นอนไว, เรียน RAG, จุ้บมส)
  7. **Backlog Analysis:** การ์ดโปรเจกต์ 13 ใบ และรายการงานที่ค้างนานที่สุด
- สร้างและอัปเดตไฟล์ HTML หน้า Dashboard ที่:
  - `dual-todo/public/dashboard.html`
  - `dashboard.html` (root workspace)

### ขั้นตอนที่ 3: สรุปรายงานบทวิเคราะห์เชิงลึก (Format Executive Report)
เขียนรายงานตอบกลับผู้ใช้เป็นภาษาไทย (`ตอบเป็นภาษาไทย`) ตามโครงสร้างมาตรฐาน:
1. **ภาพรวมสถิติระดับบริหาร (Executive KPIs):** นำเสนอตารางตัวเลขสำคัญ
2. **พัฒนาการและความต่อเนื่องรายเดือน (Monthly Progression):** สรุปเปอร์เซ็นต์ความสำเร็จและแนวโน้ม
3. **การทำงานร่วมกันระหว่าง Most & Fern (Collaboration):** สัดส่วน Card Ownership และ Task Done
4. **พฤติกรรมเชิงเวลาและจังหวะชีวิต (Temporal Productivity):** Peak Hours และ Day of Week
5. **หมวดหมู่งานและเป้าหมายชีวิต (Themes & Recurring Habits):** สุขภาพ, การเรียนรู้ (Upskill), ความสัมพันธ์
6. **การวิเคราะห์งานค้างและจุดติดขัด (Backlog & Bottlenecks):** งานที่ค้างนานที่สุด และการ์ด Topic
7. **ลิงก์หน้า Dashboard:** ระบุพาธไฟล์ที่เปิดดูได้ทันที

### ขั้นตอนที่ 4: ตรวจสอบและ Build Asset
รันคำสั่ง Build เพื่อให้แน่ใจว่า Dashboard ถูกแพ็กเกจลงใน distribution bundle อย่างถูกต้อง:
```bash
cd dual-todo && npm run build
```

---

## 💬 ตัวอย่าง Prompt สำหรับผู้ใช้งาน (User Prompt Templates)

ผู้ใช้สามารถใช้ Prompt ต่อไปนี้เพื่อเรียกใช้งานสกิลนี้:

### แบบที่ 1: สรุปภาพรวมและอัปเดต Dashboard เต็มรูปแบบ (Full Analysis)
> *"ช่วยอ่านข้อมูลทั้งหมดของ database ครับ จากนั้นช่วยสรุป insight แบบละเอียด และอัปเดตหน้า dashboard สำหรับวิเคราะห์เป็น static ให้หน่อยครับ"*

### แบบที่ 2: สรุปเฉพาะความคืบหน้าระหว่าง Most & Fern (Collaboration Focus)
> *"อยากดูสรุปสถิติเปรียบเทียบการทำงานระหว่าง Most กับ Fern ตั้งแต่วันแรกจนถึงปัจจุบัน ใครเคลียร์งานช่วงเวลาไหนเยอะที่สุด"*

### แบบที่ 3: วิเคราะห์งานค้างและนิสัยที่ทำบ่อย (Backlog & Habit Audit)
> *"ช่วยวิเคราะห์งานค้างสะสม (Backlog) และสรุปกิจวัตร/Habits ที่ทำซ้ำบ่อยที่สุด พร้อมข้อเสนอแนะในการจัดการ"*

---

## 📋 เกณฑ์การยอมรับงาน (Definition of Done)
- [ ] ดึงข้อมูลล่าสุดจาก Firestore สำเร็จครบทุกเอกสาร
- [ ] ตัวเลขในรายงานตรงกับสถิติจริง 100%
- [ ] หน้า `public/dashboard.html` และ `dashboard.html` ถูกอัปเดตด้วยดีไซน์ High Readability (ธีมสว่างอ่านง่าย, ฟอนต์ Prompt/Inter, มีแถบ Tabs 4 หมวดหมู่)
- [ ] กราฟ Chart.js ทุกตัว (Timeline, Cumulative, Hourly, Day of Week, Monthly, Assignee) แสดงผลถูกต้อง
- [ ] `npm run build` ผ่าน 0 errors
