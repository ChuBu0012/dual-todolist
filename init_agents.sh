#!/bin/bash

# รับ input ชื่อ agent folder หากไม่ใส่ให้ใช้ .agents เป็นค่าเริ่มต้น
AGENT_NAME="${1:-.agents}"

echo "Initializing project structure for agent: '$AGENT_NAME'..."

# 1. สร้างโครงสร้างไดเรกทอรีหลัก
# โฟลเดอร์ root skills/ และ tools/ ยังคงอยู่ที่เดิมตามสเปก
mkdir -p "$AGENT_NAME"
mkdir -p skills
mkdir -p tools

# 2. สร้างโครงสร้างภายใน Agent Folder (Profiles)
# สร้าง profile 'default' และโฟลเดอร์ย่อยต่างๆ ตามสเปก
mkdir -p "$AGENT_NAME/profiles/default/skills"
mkdir -p "$AGENT_NAME/profiles/default/plugins"
mkdir -p "$AGENT_NAME/profiles/default/cron"
mkdir -p "$AGENT_NAME/profiles/default/memories"

# 3. สร้างไฟล์ตั้งต้น (Empty files)
touch "$AGENT_NAME/config.yaml"
touch "$AGENT_NAME/profiles/default/memories/facts.md"

# 4. สร้างไฟล์ .gitkeep เพื่อคงโครงสร้างโฟลเดอร์ว่างไว้ใน Git
touch "$AGENT_NAME/profiles/default/skills/.gitkeep"
touch "$AGENT_NAME/profiles/default/plugins/.gitkeep"
touch "$AGENT_NAME/profiles/default/cron/.gitkeep"
touch skills/.gitkeep
touch tools/.gitkeep

echo "----------------------------------------"
echo "Structure created successfully:"
echo "Root: ./config.yaml, ./skills/, ./tools/"
echo "Agent Root: ./$AGENT_NAME/"
echo "Active Profile: $AGENT_NAME/profiles/default/"
echo "----------------------------------------"