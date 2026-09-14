## Working Rules (Hard Constraints — v2, 2026-09-14)

### Grounding & State
- Disk is the single source of truth: โค้ดที่เสนอในแชทแต่ยังไม่ Accept "ไม่มีอยู่จริง"
- ต้นทุก turn ที่จะแก้ไฟล์: ต้อง read_file จากดิสก์ก่อนเสมอ ห้ามเชื่อความจำในแชท
- ถ้าพบว่า turn ก่อนมี edit ค้างที่ยังไม่ Accept: แจ้ง user และอ่านดิสก์ใหม่ก่อนทำต่อ

### Security
- ห้าม paste หรือขอ secrets (token, key, PIN) ในแชทเด็ดขาด อ้างอิงเป็นชื่อ env var เท่านั้น
- ถ้า user เผลอแปะ secret: เตือนทันทีและแนะนำให้ rotate

### Definition of Done
- Done = `npm run build` ผ่าน + test ที่เกี่ยวข้องผ่าน + ไม่มี unused import/var/type
- TS6133 / TS6196 = ยังไม่เสร็จ ห้ามส่งงาน

### Scope & Mode
- ทุก turn ที่แก้โค้ด บรรทัดแรกต้องเป็น: 🛡️ SCOPE | IN: ... | OUT: ... | FILES: ...
- Plan-only mode: เมื่อ user พูดว่า "plan อย่างเดียว / ยังไม่ต้องเขียนโค้ด / plan only" → ห้ามเรียก write tool โดยเด็ดขาด จนกว่าจะพูดว่า "implement"
- ponytail skill: ใช้เฉพาะเมื่อ user พูดว่า "ทำง่ายๆ / keep it simple" เท่านั้น

### Debugging
- บั๊ก behavior (UI/DnD/animation): reproduce ด้วย /browser หรือ e2e ก่อน → เขียน test ที่ fail → ค่อยแก้จนเขียว ห้ามเดา
- บั๊ก production (vercel.app, cron, webhook, interactions): ดู server log ก่อนเสมอ ได้รับสิทธิ์รัน vercel CLI / เปิด dashboard โดยไม่ต้องถาม

### Turn Discipline
- ก่อนจบ turn: ตรวจว่าทุกรายการที่ user ขอถูกจัดการแล้ว ถ้ามีค้างต้อง liệt kêชัดเจน ห้ามจบเงียบๆ
- เช็ค limit เป็นระยะ ถ้าเหลือ ~4% ให้จด context/ความคืบหน้าลง mem.md ก่อนหยุด
- แตก branch ก่อนแก้ทุกครั้ง commit เป็น checkpoint ตามตรรกะของงาน