---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
---

# Diagnosing Bugs

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, read `CONTEXT.md` or `PROJECT_CONTEXT.md` if it exists to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.

## Redact

This skill has you show commands, outputs and captured artifacts. **Redact every secret first**: write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.

If the redacted output is not enough to diagnose the bug, say so and ask the user.

## Phase 1: Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug (one that goes red on _this_ bug), you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one, in roughly this order

1. **Failing test** at whatever seam reaches the bug: unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** using Playwright or Puppeteer that drives the UI and asserts on DOM, console, or network.
5. **Replay a captured trace** by saving a real request, payload, or event log and replaying it through the code path in isolation.
6. **Throwaway harness** with a minimal subset of the system and mocked dependencies.
7. **Property or fuzz loop** for intermittent wrong output.
8. **Bisection harness** when the bug appeared between known commits, datasets, or versions.
9. **Differential loop** comparing old and new versions or configurations.
10. **Human-in-the-loop script** as a last resort, with captured output feeding back into the loop.

Build the right feedback loop, and the bug is 90% fixed.

### Tighten the loop

Treat the loop as a product. Make it faster by narrowing setup and scope, sharper by asserting the specific symptom, and deterministic by pinning time, random seeds, filesystem state, and network behavior.

### Non-deterministic bugs

The goal is not a clean repro but a higher reproduction rate. Loop the trigger repeatedly, parallelise where useful, narrow timing windows, and inject controlled stress until the failure is debuggable.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for access to the reproducing environment, a redacted captured artifact, or permission to add temporary instrumentation. **Do not proceed to hypothesise without a loop.**

### Completion criterion: a tight loop that goes red

Phase 1 is done only when one command has already been run and is:

- **Red-capable:** drives the actual bug path and asserts the exact symptom.
- **Deterministic:** gives the same verdict each run, or has a documented high reproduction rate.
- **Fast:** runs in seconds where practical.
- **Agent-runnable:** runs unattended.

If you catch yourself reading code to build a theory before this command exists, stop. No red-capable command means no Phase 2.

## Phase 2: Reproduce and minimise

Run the loop and confirm it produces the user's described failure, not a nearby failure. Reproduce it across multiple runs and capture the exact symptom.

Shrink the repro one input, caller, configuration value, data element, or step at a time. Keep only load-bearing elements. Do not proceed until the smallest scenario still goes red.

## Phase 3: Hypothesise

Generate **3 to 5 ranked hypotheses** before testing any of them. Each must be falsifiable:

> If `<X>` is the cause, then changing `<Y>` will make the bug disappear or changing `<Z>` will make it worse.

If a prediction cannot be stated, discard or sharpen the hypothesis. Show the ranked list to the user before testing when practical so domain knowledge can re-rank it.

## Phase 4: Instrument

Each probe must map to one prediction. Change one variable at a time. Prefer a debugger or REPL, then targeted logs at boundaries that distinguish hypotheses. Never log everything.

Tag temporary logs with a unique prefix such as `[DEBUG-a4f2]` so cleanup is one search. For performance regressions, measure a baseline and bisect instead of relying on logs.

## Phase 5: Fix and regression test

Write the regression test before the fix when there is a correct seam. The test must exercise the real bug pattern at its call site, not a shallow implementation detail.

1. Turn the minimised repro into a failing test.
2. Watch it fail.
3. Apply the fix.
4. Watch it pass.
5. Re-run the original, broader feedback loop.

If no correct seam exists, document that as a finding instead of creating false confidence.

## Phase 6: Cleanup

Before declaring done:

- Re-run the original repro and confirm it no longer fails.
- Confirm the regression test passes, or document the missing seam.
- Remove all `[DEBUG-...]` instrumentation.
- Delete throwaway prototypes or move them to a clearly marked debug location.
- State the confirmed root cause and the evidence that established it in the final report or change record.
