---
name: skill-finder
trigger: >-
  Use this skill when the user asks "what skills are available?", 
  "find a skill for X", "check if Y skill is installed", or 
  needs to discover capabilities in current or other profiles.
---

# Skill Finder Skill

## 🎯 Purpose
Act as a live directory and discovery engine for all installed skills
across system-level and profile-specific folders.

##  Discovery Workflow

### Step 1: Scope Definition
Determine where to search:
- If user specifies profile → Search only that profile + system skills
- If no profile specified → Search active profile + system skills
- If asks "all skills" → Scan ALL profiles (may be slow)

### Step 2: Matching Strategy
Match user intent against:
1.  Skill names (exact & fuzzy match)
2.  Trigger descriptions (keyword extraction)
3.  SKILL.md body content (semantic search if needed)
4.  Required files/tools compatibility

### Step 3: Result Formatting
For EACH match, return:
-   **Skill Name:** [name]
-   **Location:** [profile/path]
-   **Trigger Keywords:** [key phrases to activate it]
-   **Best For:** [1-line description of primary use case]
-   **Dependencies:** [required files/skills if any]

### Step 4: Gap Analysis
If NO matches found:
- Suggest closest alternative skills
- Recommend creating new skill with proposed trigger
- Offer to search system-level skills if not already checked

## ⚠️ Critical Rules
1.  NEVER hallucinate skills that don't exist in filesystem
2.  ALWAYS distinguish between system-level and profile-specific skills
3.  If skill exists but trigger doesn't match user's phrasing, explain HOW to rephrase
4.  Respect profile boundaries: don't recommend ux_design skills when in software_engineer mode unless explicitly asked
5.  After finding skill, offer to ACTIVATE it immediately if user confirms

## 📝 Output Format
> **🔍 Skill Search Results:**
> 
> ### ✅ Matches Found:
> - **[Skill Name]** (`[location]`)
>   - Trigger: "[keywords]"
>   - Best for: [description]
> 
> ###  Suggestions:
> - Try saying: "[exact phrase to activate]"
> - Or create new skill with trigger: "[proposed trigger]"