---
name: project-planner
trigger: >-
  Use this skill when the user asks to "plan a feature", 
  "design architecture", "break down tasks", or needs a structured 
  roadmap before coding. Always activate at the start of new feature development.
requires_files: [PROJECT_CONTEXT.md]
---

# Project Planner Skill

## 🎯 Purpose
Transform vague requirements into actionable, lightweight technical plans 
that respect the project's constraints (React+TS+Zustand+Firestore+PWA).

## 📋 Planning Framework

### Step 1: Requirement Clarification
- Ask 3-5 targeted questions to uncover hidden assumptions
- Map requirements to PROJECT_CONTEXT.md constraints
- Identify "Cute UI" and "Smooth Interaction" success criteria

### Step 2: Architecture Decision
- Choose Zustand slices needed (todoSlice, syncSlice, etc.)
- Define Firestore collection structure + security rules
- Plan PWA offline strategy (cache vs sync vs conflict resolution)
- Select DaisyUI components for "cute" aesthetic

### Step 3: Task Breakdown
- Split into atomic tasks (< 2 hours each)
- Label each task with required skills (e.g., [react-state-management], [daisyui])
- Mark dependencies between tasks
- Estimate complexity (S/M/L) based on offline/PWA requirements

### Step 4: Risk Assessment
- Identify potential blockers (Firestore rate limits, PWA cache issues)
- Propose mitigation strategies
- Flag any violations of "Lightweight First" principle

## 📄 Output Format
Generate a `FEATURE_PLAN.md` with:
- Overview & Success Criteria
- Architecture Diagram (text-based)
- Task Checklist with skill tags
- Risk Matrix
- Reference to relevant PROJECT_CONTEXT.md sections

## ️ Rules
- NEVER skip reading PROJECT_CONTEXT.md
- ALWAYS prioritize offline-first design
- If plan exceeds 3 major components, suggest splitting into phases
- End with: "Ready to code? Say 'start task #X' to begin."