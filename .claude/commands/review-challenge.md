---
allowed-tools: Bash(kubeasy*),Bash(kubectl*),Bash(cat*),Bash(grep*),Bash(ls*),Bash(sleep*),Bash(head*),Bash(tail*),Read,Write,Edit
description: Review a Kubeasy challenge for quality, pedagogy, and bypass resistance
---

You are a Kubernetes engineer discovering a Kubeasy challenge for the first time.
Your job is to assess the quality of the challenge as a learning experience.

**Critical rule: You have NO prior knowledge of the solution. You must discover it through investigation at runtime, exactly as a real learner would.**

## Input

- `$ARGUMENTS` contains: `SLUG: <slug>`
- The challenge is in the current working directory under `<slug>/`

## Review Process

### Phase 1: Understand the Promise (DO NOT look at manifests)

Read ONLY `<slug>/challenge.yaml` metadata fields. Note:
- What does the **description** tell the user? (symptoms only, no causes?)
- What's the **initialSituation**? (clear enough to start investigating?)
- What's the **objective**? (outcome-based, not method-based?)
- What **difficulty** and **estimatedTime** are claimed?
- Do objective **titles** reveal the solution?

**STOP. Do NOT read `manifests/` or `policies/` yet.**
You must experience the challenge as a learner first.

### Phase 2: Lint

Run structural validation before deploying anything:

```bash
kubeasy dev lint <slug>
```

If lint fails → **stop the review immediately**, score 0/20, verdict ❌ Fail.
Write the PR comment with lint errors and exit.

### Phase 3: Deploy and Verify Broken State

```bash
kubeasy dev apply <slug> --clean
sleep 10
kubeasy dev status <slug>
```

**Then immediately run validations:**

```bash
kubeasy dev validate <slug>
```

All validations MUST FAIL at this point. This confirms the broken state is real.

- If **all validations pass** → the challenge is not broken. Score 0 for Pedagogy, flag as "broken state is not broken".
- If **some pass, some fail** → note which ones. Verify it makes sense for the design.

### Phase 4: Investigate (as a real learner)

Use only standard Kubernetes tools:

```bash
kubectl get all -n <slug>
kubectl describe pod -n <slug> -l app=<slug>
kubectl logs -n <slug> -l app=<slug>
kubectl get events -n <slug> --sort-by='.lastTimestamp'
```

**Track your investigation path** — the sequence of commands and what each revealed.

### Phase 5: Attempt Resolution

1. Form a hypothesis about what's wrong
2. Apply a fix using `kubectl`
3. Verify with `kubeasy dev validate <slug>`

**Maximum 5 attempts.** If you can't solve it after 5 tries, flag the challenge and continue.

### Phase 6: Bypass Testing

Reset to broken state:

```bash
kubeasy dev apply <slug> --clean
sleep 10
```

Then try obvious bypasses:
- Delete and recreate resources from scratch
- Replace the container image
- Delete constraining resources (NetworkPolicies, etc.)
- Any shortcut that would skip the learning

Check: could a user pass validations without understanding the concept?

### Phase 7: Post-Mortem (NOW read manifests & policies)

Only now, read the source files:
- `<slug>/manifests/*.yaml` — Was the bug realistic? Was there only one issue?
- `<slug>/policies/*.yaml` — Do they protect the educational frame?

**CRITICAL — Comment spoiler check:**

Scan ALL YAML comments (`#`) in manifests and policies. If any comment reveals the root cause, the fix, or hints too strongly at the solution → **automatic 0/20, verdict ❌ Fail**.

Spoiler comments that trigger a 0:
- `# TODO: memory limit is too low, should be 128Mi`
- `# Bug: wrong port number, correct is 8080`
- `# This label is intentionally wrong`
- `# Fix: add the missing readiness probe`

Comments that are OK:
- `# Kyverno: protect base image to preserve scenario`
- `# Application configuration`

### Phase 8: Score

Rate each criterion from 0 to 4:

| Criterion | 4 (Excellent) | 3 (Good) | 2 (Needs work) | 1 (Poor) | 0 (Broken) |
|-----------|---------------|----------|-----------------|----------|------------|
| **Clarity** | Crystal clear symptoms, situation, objective | Minor ambiguity | Missing context | Confusing or misleading | Incomprehensible |
| **Pedagogy** | Teaches exactly the right concept, natural investigation path | Minor gaps in learning flow | Some misdirection or mixed concepts | Minimal educational value | Teaches nothing or bad practices |
| **Validation** | Checks outcomes perfectly, accepts multiple valid solutions | Rare edge cases could slip | Some misalignment with learning goal | Checks implementation, not outcome | Broken or missing |
| **Bypass resistance** | All shortcuts blocked, educational frame solid | Minor theoretical bypasses | Significant bypass possible | Easy to cheat without learning | Trivially bypassable |
| **UX** | Difficulty/time accurate, errors helpful, smooth flow | Minor friction | Noticeable gaps in feedback | Frustrating experience | Impossible or broken |

**Total: /20**

### Phase 9: Write PR Comment

Write a spoiler-free PR comment to `review-<slug>-pr-comment.md` in the current directory.

**The PR comment MUST NOT reveal:** the root cause, the fix, specific commands used, or any detail that spoils the investigation.

```markdown
## 🔍 Challenge Review: <title>

**Score: X/20** · Verdict: ✅ Pass | ⚠️ Needs work | ❌ Fail

| Criterion | Score | Comment |
|-----------|:-----:|---------|
| Clarity | X/4 | <spoiler-free> |
| Pedagogy | X/4 | <spoiler-free> |
| Validation | X/4 | <spoiler-free> |
| Bypass resistance | X/4 | <spoiler-free> |
| UX | X/4 | <spoiler-free> |

### Issues
- <issue without revealing solution>

### Recommendations
- <recommendation without revealing solution>

### Flags
- Solvable: ✅/❌
- Bypass found: ✅/❌
- Coherent with learning goal: ✅/❌
- Solved in X attempt(s)

---
*Reviewed by Kubeasy Challenge Reviewer*
```

### Phase 10: Clean up

```bash
kubeasy dev clean <slug>
```

## Spoiler-Free Writing Guide

| ❌ Reveals solution | ✅ Spoiler-free equivalent |
|---|---|
| "The memory limit is set to 10Mi" | "Description hints too strongly at root cause" |
| "User can just delete the NetworkPolicy" | "A bypass exists through resource deletion" |
| "The liveness probe path /healthz doesn't exist" | "Investigation path leads naturally to the issue" |
| "Fix: increase memory to 128Mi" | "Solved in 1 attempt with a targeted fix" |
| "The RBAC Role is missing 'list' verb" | "Validation correctly checks outcome, not implementation" |

## Verdict Thresholds

| Score | Verdict | Action |
|-------|---------|---------|
| 18-20 | ✅ Pass | Ready to merge |
| 14-17 | ⚠️ Needs work | Minor tweaks needed |
| 10-13 | ❌ Fail | Significant revision needed |
| < 10 | ❌ Fail | Major redesign required |
