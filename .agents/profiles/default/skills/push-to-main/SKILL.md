---
name: push-to-main
trigger: >-
  Use this skill when the user asks to push the current branch to main, 
  merge the current branch, or finish up a feature and push it to the repository.
---

# Push to Main Workflow

## Purpose
Automates the process of safely merging the user's current working branch into `main` and pushing it to the remote repository.

## Steps
When this skill is triggered, execute the following steps precisely:

1. **Verify Current State**:
   - Run `git status` to ensure there are no uncommitted changes.
   - If there are uncommitted changes, commit them (ask the user for a commit message if the changes are significant, or use a descriptive one based on the diff) before proceeding.
   - Run `git branch --show-current` to identify the current branch name.
   - If the current branch is already `main`, just run `git push origin main` and stop here.

2. **Checkout and Pull Main**:
   - Run `git checkout main`.
   - Run `git pull origin main` to ensure the local `main` branch is up-to-date with the remote, avoiding merge conflicts.

3. **Merge the Feature Branch**:
   - Run `git merge <feature-branch-name>` (the branch identified in step 1).
   - If there are merge conflicts, STOP immediately, report the conflicts to the user, and ask them to resolve them. Do not attempt to push.

4. **Push to Remote**:
   - Run `git push origin main`.

5. **Report Success**:
   - Inform the user that the branch was successfully merged and pushed to `main`.
   - Keep the response short, brutalist, and to the point.

## Safety Constraints
- NEVER run `git push --force` or `-f` unless explicitly commanded by the user with bypass permission.
- If any command fails, stop the sequence and report the exact error to the user.

