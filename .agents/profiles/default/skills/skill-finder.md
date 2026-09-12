---
name: skill-finder
trigger: >-
  Use this skill when the user asks "what skill should I use?", 
  "find a skill for...", or is unsure which tool/skill fits their current task.
---

# Skill Finder Skill

## Steps
1. Analyze the user's current request or goal.
2. List all available skills in `skills/` and `profiles/<active_profile>/skills/`.
3. Match the user's intent with the `trigger` description of each skill.
4. Recommend the top 1-3 most relevant skills with a brief explanation of why they fit.
5. If no skill matches, suggest creating a new one or using built-in tools.

## Notes
- Prioritize profile-specific skills over system-level skills.
- Be concise; don't list every single skill if only one is clearly relevant.