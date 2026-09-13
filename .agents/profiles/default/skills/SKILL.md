---
name: cross-profile-router
trigger: >-
  Use this skill when the user's request requires expertise outside 
  the current 'default' profile, such as coding, testing, UI design, 
  or user research. Also use when user explicitly asks to "switch roles", 
  "get engineering advice", or "design this".
---

# Cross-Profile Router Skill

## ⚠️ Mandatory Core Rules & User Preferences
> **IMPORTANT:** Before performing any actions, always inspect and follow `profiles/default/memories/facts.md`!
> 1. **Git Branching Rule:** ALWAYS create/checkout a new git branch (`git checkout -b <branch-name>`) BEFORE modifying or writing any code.
> 2. **Context First Rule:** ALWAYS read and thoroughly inspect relevant context, existing files, and dependencies BEFORE making edits so no necessary parts or dependencies are missed.

## 🎯 Purpose
Act as a bridge between the 'default' persona and specialized role profiles.
Dynamically select and activate skills from other profiles based on task requirements.

## 🗺️ Available Profiles & Expertise

| Profile | Core Expertise | Key Skills to Look For |
| :--- | :--- | :--- |
| `software_engineer` | React, TS, Zustand, Firestore, PWA, Architecture | `react-state-management`, `code-reviewer`, `firebase-firestore`, `scope-guardian`, `ponytail` |
| `tester_engineer` | Vitest, Test Strategy, Edge Cases, QA | `test-master`, `vitest`, `bug-report-formatter` |
| `ux_design` | DaisyUI, Tailwind, Interface Kit, Visual Design | `interface-kit`, `web-design-guidelines`, `daisyui` |
| `ux_research` | User Journey, Edge Case Discovery, Interviews | `journey`, `deliver-edge-cases`, `persona-creator` |

> **Note for `ponytail` skill:** Only invoke the `ponytail` skill from the `software_engineer` profile when the user explicitly requests "ทำง่ายๆ" (make it easy/simple).

## ️ Decision Workflow

### Step 1: Intent Analysis
Analyze user request to determine primary domain:
- Code/Architecture/State → `software_engineer`
- Testing/Validation/QA → `tester_engineer`
- UI/Visuals/Components → `ux_design`
- User Behavior/Research/Flows → `ux_research`
- Mixed/Hybrid → Identify PRIMARY domain + SECONDARY support needed

### Step 2: Skill Discovery (Read Triggers)
For the target profile(s):
1. Scan `profiles/{target}/skills/*/SKILL.md` frontmatter ONLY
2. Match user intent against each skill's `trigger` description
3. Select top 1-3 most relevant skills
4. Note any `requires_files` or `requires_skills` dependencies

### Step 3: Activation Strategy
Choose execution mode:
- **Direct Handoff:** "Switching to software_engineer mode. Using react-state-management..."
- **Consultation:** "Asking software_engineer profile for advice on Zustand architecture..."
- **Multi-Profile Collaboration:** "Combining ux_design (for cute UI) + software_engineer (for implementation)..."

### Step 4: Context Preservation
Before activating external skill:
- Pass relevant context from current session (PROJECT_CONTEXT.md, current constraints)
- Ensure external skill respects "Lightweight First" principle
- Maintain Thai language preference unless technical terms require English

## 📝 Output Format
When routing to another profile:

> **🔄 Cross-Profile Activation:**
> - **Target Profile:** [profile_name]
> - **Selected Skill(s):** [skill_name(s)]
> - **Reason:** [Why this profile/skill fits the task]
> - **Context Passed:** [Key constraints/info shared]
> - **Expected Outcome:** [What will be delivered]

Then IMMEDIATELY proceed with the selected skill's steps.

## ️ Critical Rules
1.  NEVER hallucinate skills that don't exist in target profile
2.  ALWAYS read actual SKILL.md triggers before selecting — don't guess
3.  If multiple profiles could help, choose the ONE with deepest expertise for primary task
4.  Preserve user's core preferences (Thai language, Lightweight, Cute UI) across all profiles
5.  After external skill completes, return to default profile with summary
6.  If no suitable skill found in any profile, suggest creating one or using default capabilities

## 💡 Pro Tips for Most
- Use this skill when you feel "stuck" in default mode and need specialized help
- Great for hybrid tasks: "Design AND implement a cute todo card" → ux_design + software_engineer
- Always verify external skill output aligns with PROJECT_CONTEXT.md constraints