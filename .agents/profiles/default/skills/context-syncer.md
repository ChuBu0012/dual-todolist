---
name: context-syncer
trigger: >-
  Use this skill when the user says "update docs", "sync context", 
  "refresh readme", "document changes", or after completing a major feature/task.
requires_files: [PROJECT_CONTEXT.md, README.md]
requires_skills: [project-planner, scope-guardian, code-reviewer]
---

# Context Syncer Skill

## 🎯 Purpose
Keep project documentation (README, PROJECT_CONTEXT, ARCHITECTURE) 
in sync with actual codebase and decisions. Prevent doc drift by enforcing 
structured updates through specialized skills.

## ⚙️ Required Skills Integration

### 1. scope-guardian (Pre-Sync Boundary Check)
BEFORE updating any doc:
- Define what EXACTLY will be updated in THIS turn
- Identify which sections are OUT OF SCOPE for now
- Estimate tool calls; if >60% limit, split into multiple sync sessions
- Output: **Scope & Limit Check** header as per scope-guardian v2.0

### 2. project-planner (Change Impact Analysis)
Analyze recent code changes against existing plans:
- Compare implemented features vs FEATURE_PLAN.md
- Flag deviations: "Code does X but plan said Y"
- Update architecture diagram if state structure changed
- Revise task checklist: mark completed, add new discovered tasks
- Output: Updated FEATURE_PLAN.md with change log section

### 3. code-reviewer (Documentation Quality Gate)
After drafting doc updates:
- Verify tech stack references match actual code (React+TS+Zustand+Firestore+PWA)
- Check that "Lightweight First" constraint is reflected in docs
- Ensure PWA/offline sections accurately describe implementation
- Validate Discord notification docs match webhook/bot API usage
- Flag any outdated or misleading information
- Output: Documentation quality score + specific fixes applied

##  Sync Workflow

### Step 1: Change Detection
Scan git diff or modified files since last sync:
- New/modified components → Update UI section in README
- Zustand store changes → Update state architecture in PROJECT_CONTEXT
- Firestore rule updates → Update security section
- PWA config changes → Update offline strategy docs
- Discord integration changes → Update notification workflow docs

### Step 2: Structured Update
For EACH detected change:
1. Locate relevant section in target doc
2. Draft update using code-reviewer standards
3. Cross-reference with PROJECT_CONTEXT.md constraints
4. Apply scope-guardian boundaries (no unsolicited additions)
5. Mark section as [SYNCED: YYYY-MM-DD] with brief changelog

### Step 3: Consistency Validation
Run cross-doc checks:
- README tech stack == PROJECT_CONTEXT tech stack?
- Architecture diagram matches actual folder structure?
- Task checklist reflects current completion status?
- All "cute UI" claims have corresponding DaisyUI component refs?

If inconsistency found → Flag as [⚠️ DRIFT DETECTED] and propose fix

### Step 4: Final Output
Generate sync report:
> **🔄 Context Sync Report:**
> - Files Updated: [list]
> - Changes Applied: [bullet points]
> - Drift Detected: [none / list with proposed fixes]
> - Next Sync Trigger: [when to run again, e.g., "after next feature complete"]
> - Tool Calls Used: [N]/[Max]

##  Anti-Patterns to Block
1.  **Full Rewrite:** Never regenerate entire doc; only update changed sections
2.  **Speculative Docs:** Don't document planned features not yet implemented
3.  **Generic Descriptions:** "Uses React" → ❌ | "React 18+ TS with Zustand slices" → ✅
4.  **Orphaned Sections:** Remove docs for deleted/renamed features immediately
5.  **Unvalidated Claims:** Every technical claim must reference actual file/code

## ✅ Critical Rules
1.  ALWAYS run scope-guardian BEFORE touching any doc file
2.  ALWAYS validate with code-reviewer AFTER drafting updates
3.  NEVER exceed 70% of max_tool_calls_per_turn for sync tasks
4.  If sync requires >70% calls, output partial sync report + resume plan
5.  Preserve existing doc formatting and tone; only update content
6.  Add [SYNCED] timestamp to every modified section for audit trail