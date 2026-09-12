---
name: scope-guardian
trigger: >-
  Use this skill BEFORE starting any implementation task to define 
  strict boundaries, OR when approaching tool/loop limits, or when 
  the user says "stop", "that's enough", "don't add X".
requires_files: [PROJECT_CONTEXT.md]
---

# Scope Guardian Skill (v2.0)

##  Purpose
Prevent over-engineering, feature creep, and token/loop limit exhaustion.
Ensure every action stays within explicit request, PROJECT_CONTEXT constraints, 
and system resource limits.

## 🚫 Anti-Patterns to Block
1.  **Library Bloat:** Suggesting new dependencies without explicit approval.
2.  **Premature Optimization:** Adding caching/memoization before profiling proves need.
3.  **Future-Proofing Overload:** Building abstractions for "someday" features not in current plan.
4.  **UI Polish Creep:** Adding animations/effects beyond "cute + smooth" baseline.
5.  **Backend Overkill:** Creating extra Firestore collections/indexes without justification.
6.  **Single-Turn Completionism:** Attempting to finish multi-step tasks in one turn.

## ✅ Enforcement Steps

### Step 0: Pre-Task Boundary Definition
Before ANY code generation, state clearly:
-   **IN SCOPE:** [Exact deliverables for THIS turn only]
-   **OUT OF SCOPE:** [Related but deferred items]
-   **ASSUMPTIONS:** [Explicit assumptions about missing info]
-   **ESTIMATED TOOL CALLS:** [Predicted count vs max_tool_calls_per_turn]

If estimated calls > 60% of limit → STOP and split task further.

### Step 1: Lightweight Checkpoint (After EVERY Tool Call)
Self-assess after each action:
-   [ ] Is this step essential for CURRENT task?
-   [ ] Have I exceeded 60% of max_tool_calls_per_turn?
-   [ ] Can remaining work safely wait for next turn?
-   [ ] Does this violate "Lightweight First" constraint?

If ANY answer is YES → Stop immediately and report progress.

### Step 2: Stop Signal Recognition
Halt IMMEDIATELY if user says:
-   "พอแค่นี้" / "That's enough"
-   "ไม่ต้องทำ..." / "Don't add..."
-   "ซับซ้อนไป" / "Too complex"
-   "เก็บไว้ทีหลัง" / "Save for later"
-   "ติด limit แล้ว" / "Hit the limit"

Confirm halt with: "Stopped at [specific point]. Remaining: [list]."

### Step 3: Post-Implementation Audit
Before presenting results, verify:
-   [ ] Did I add anything not explicitly requested?
-   [ ] Is there a simpler way using built-in tools?
-   [ ] Does this violate PROJECT_CONTEXT.md constraints?
-   [ ] Are all generated files syntactically valid?

If YES to any → Refactor BEFORE responding.

## 📝 Output Format
ALWAYS start responses with:
> **️ Scope & Limit Check:**
> - Doing: [X] | NOT doing: [Y]
> - Tool Calls Used: [N]/[Max] | Est. Remaining: [M]
> - Reason: [Z based on PROJECT_CONTEXT.md]
> - Next Turn Preview: [What will be done next if continued]

## ️ Critical Rules
1.  When in doubt, DO LESS. Easier to add later than remove bloat.
2.  NEVER exceed 80% of max_tool_calls_per_turn in a single turn.
3.  If task requires >80% calls, MUST split into sub-tasks BEFORE starting.
4.  Always reference PROJECT_CONTEXT.md when justifying scope decisions.
5.  Termination Criteria: Stop when ALL checklist items done OR limit reached OR user stops.
## 🚫 Anti-Patterns to Block
ุ6.  **Code Preview in Chat:** 
    - NEVER print code blocks (<div>, function, etc.) in conversation
    - This causes "Accept" button to capture garbage text
    - ALWAYS write directly to filesystem via write_file tool
    - If user wants to review → Write to temp file first, then read_file to show
    ## Mandatory Pre-Write Check


BEFORE using write_file on ANY existing file:
1. MUST call read_file first to get current content
2. Compare with user's requested changes
3. Preserve ALL user modifications not mentioned in request
4. Only modify what was explicitly asked
5. If unsure about a section → Keep it unchanged, don't guess