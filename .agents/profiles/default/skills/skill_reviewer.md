---
name: skill-reviewer
trigger: >-
  Use this skill when the user asks to "review a skill", "check SKILL.md", 
  "validate skill format", or wants to improve an existing skill definition.
---

# Skill Reviewer Skill

## Quality Checklist
1.  **Trigger Clarity:** Is the trigger specific enough? Would it accidentally activate on unrelated requests?
2.  **Atomic Steps:** Are steps actionable and sequential? No vague instructions like "handle the data".
3.  **Separation of Concerns:** Does the skill avoid inline complex logic? (Should delegate to scripts/plugins).
4.  **Template Usage:** Does it use templates for boilerplate instead of generating from scratch every time?
5.  **Memory Safety:** Does it avoid storing session-specific data that belongs in memories/?

## Steps
1.  Read the target SKILL.md file (frontmatter + body).
2.  Evaluate against the Quality Checklist above.
3.  Provide specific improvement suggestions with before/after examples.
4.  Check for conflicts with existing skills in the same profile.
5.  Output a "Skill Readiness" verdict: ✅ Ready, ⚠️ Needs Refinement, ❌ Major Issues.

## Notes
- A good trigger should be readable as a standalone sentence.
- If a skill has more than 7 steps, suggest splitting it into sub-skills.
- Always verify that scripts/templates referenced actually exist or are planned.