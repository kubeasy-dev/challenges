## 🔍 Challenge Review: Cascading Blackout

**Score: 19/20** · Verdict: ✅ Pass

| Criterion | Score | Comment |
|-----------|:-----:|---------|
| Clarity | 4/4 | Symptom-only description, realistic incident framing. The hint that "multiple components" were affected sets expectations without revealing cause. All validation titles remain generic throughout. |
| Pedagogy | 4/4 | Teaches three complementary networking concepts in one challenge (label-based pod selectors, egress rules, and additive policy composition). Investigation path flows naturally from observable symptoms to root causes. Two-bug cascading design is realistic and earns its Hard rating. |
| Validation | 3/4 | All checks are consistent and reliable — no timing-related flakiness. The intermediate validation provides useful partial-progress feedback when one fix is applied before the other. Minor: it checks a specific implementation detail rather than a pure outcome, which is slightly narrower than ideal but justified by the pedagogical value of the intermediate signal. |
| Bypass resistance | 4/4 | All three NetworkPolicies protected against both deletion and modification. Images locked. One error message proactively hints at the correct remediation approach for the connectivity gap, guiding learners without revealing the solution. No bypasses found. |
| UX | 4/4 | The gateway connectivity validation now passes consistently in broken state, correctly focusing learner attention on the backend-to-cache tier. Error messages from protection policies are informative. Intermediate validation feedback reflects partial progress cleanly. Difficulty and time estimate are accurate. |

### What works well

This is a well-crafted challenge that mirrors real production incidents. The "security hardening touched multiple components at once" framing is authentic — this is exactly how cascading failures occur in practice. The investigation path is well-structured: observable symptoms in logs point toward the network layer, where two independent but cooperative issues reveal themselves. Neither fix alone is sufficient, which teaches learners to reason about the full communication chain rather than stopping at the first finding. The intermediate validation turns what could be a frustrating two-bug puzzle into a guided discovery experience. All protection policies have clear, actionable error messages.

### Minor note

The intermediate validation checks a specific metadata property rather than an observable service behavior. This is an acceptable trade-off for the feedback value it provides, but a future improvement could express the same constraint through the final end-to-end outcome alone (i.e., rely solely on the log validation to confirm full connectivity once both fixes are in place).

### Flags

- Solvable: ✅
- Bypass found: ❌
- Coherent with learning goal: ✅
- Solved in 1 attempt (two coordinated sub-fixes applied simultaneously)

---
*Reviewed by Kubeasy Challenge Reviewer*
