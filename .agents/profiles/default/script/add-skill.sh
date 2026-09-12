#!/bin/bash
# add-skill.sh - Wrapper สำหรับติดตั้ง Skill เข้า Profile เฉพาะ

PROFILE="${1:-software_engineer}" # ค่าเริ่มต้นคือ software_engineer
SKILL_URL="$2"
SKILL_NAME="$3"

if [ -z "$SKILL_URL" ]; then
    echo "❌ Usage: ./add-skill.sh <profile> <skill-url> [skill-name]"
    echo "   Example: ./add-skill.sh software_engineer https://github.com/wshobson/agents react-state-management"
    exit 1
fi

echo "📦 Installing skill into .agents/profiles/${PROFILE}/skills/..."

# ใช้ --output หรือ flag อื่นๆ ของ npx skills เพื่อกำหนด target path
# หาก CLI ไม่รองรับ output path โดยตรง ให้ใช้วิธี Move หลังติดตั้ง
npx skills add "$SKILL_URL" ${SKILL_NAME:+--skill $SKILL_NAME}

# ย้ายไฟล์จาก root ไปยัง profile ที่กำหนด
if [ -d "./skills/$SKILL_NAME" ]; then
    mkdir -p ".agents/profiles/${PROFILE}/skills"
    mv "./skills/$SKILL_NAME" ".agents/profiles/${PROFILE}/skills/"
    rmdir "./skills" 2>/dev/null || true # ลบโฟลเดอร์ root ถ้าว่าง
    echo "✅ Successfully moved to .agents/profiles/${PROFILE}/skills/$SKILL_NAME"
else
    echo "⚠️ Warning: Could not find installed skill in ./skills/. Check if installation succeeded."
fi