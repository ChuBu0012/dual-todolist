---
name: investigate-bug
description: >-
  Use this skill when the user asks to investigate a bug, find an issue, or complains that you are "guessing" instead of debugging properly.
---

# Investigate Bug Skill

## 🎯 Purpose
Stop guessing. Diagnose bugs systematically using evidence, logs, and reproduction before suggesting any code changes.

## 🔍 The Investigation Loop

### Step 1: Gather Evidence (No Code Changes Yet)
1. Ask the user for the exact error message or stack trace if not provided.
2. Search the codebase for the error text or relevant components using `grep` or `find_by_name`.
3. Check recently modified files that might have introduced the bug.

### Step 2: Formulate Hypotheses
List 1-2 probable causes based on the evidence. Example:
- "The state is likely undefined before the API call finishes."
- "The CSS class might be overridden by a parent container."

### Step 3: Add Targeted Probes
If the cause is not 100% obvious, **DO NOT guess the fix**. 
Instead, add temporary debug logs:
```javascript
console.log('[DEBUG-INVESTIGATE] state:', state);
```
Ask the user to run the code and report the logs back.

### Step 4: Fix and Verify
ONLY when the root cause is proven by logs or clear code logic, propose the fix.
1. Apply the fix.
2. Remove the `[DEBUG-INVESTIGATE]` logs.
3. Explain *why* it broke and *why* the fix works.

## ⚠️ Critical Rule
**Never apply 5 random fixes at once hoping one works.** Change one variable at a time. If a fix fails, revert it before trying the next hypothesis.

