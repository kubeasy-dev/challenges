# Challenge Review Report

**Date**: 2026-01-25
**Challenges Evaluated**: 21
**Average Score**: 12.7/20

---

## Summary

| Challenge | Score | Status | Priority |
|-----------|-------|--------|----------|
| tls-ingress | 4/20 | BROKEN | **CRITICAL** |
| healthy-app | 5/20 | BROKEN | **CRITICAL** |
| probes-drift | 5/20 | BROKEN | **CRITICAL** |
| volume-conflict | 5/20 | BROKEN | **CRITICAL** |
| persistent-data | 8/20 | BROKEN | **CRITICAL** |
| cert-mismatch | 9/20 | BROKEN | **CRITICAL** |
| traffic-jam | 10/20 | BROKEN | **CRITICAL** |
| partial-outage | 12/20 | NEEDS WORK | HIGH |
| env-config | 14/20 | NEEDS WORK | HIGH |
| tainted-out | 14/20 | NEEDS WORK | MEDIUM |
| first-job | 15/20 | OK | LOW |
| stuck-pending | 16/20 | OK | LOW |
| wrong-selector | 16/20 | OK | LOW |
| access-pending | 17/20 | OK | LOW |
| first-deployment | 17/20 | OK | - |
| privilege-denied | 17/20 | OK | - |
| expose-internally | 18/20 | OK | - |
| grant-access | 18/20 | OK | - |
| job-failed | 18/20 | OK | - |
| missing-credentials | 18/20 | OK | - |
| pod-evicted | 18/20 | OK | - |

---

## Priority Actions

### CRITICAL: Non-Functional Challenges (7)

These challenges pass without user action or have broken infrastructure.

#### 1. tls-ingress (4/20)
**Issue**: Validation only checks pod Ready (already true). No ingress controller installed.
**Action**:
- [ ] Add validations for TLS Secret and Ingress existence
- [ ] Add connectivity validation for HTTPS
- [ ] Install nginx-ingress or fix description

#### 2. healthy-app (5/20)
**Issue**: Passes immediately - validation only checks pod Ready, not that probes exist.
**Action**:
- [ ] Add validation to check probe configuration exists
- [ ] OR make initial app unhealthy without proper probes

#### 3. probes-drift (5/20)
**Issue**: Pod becomes Ready after 15s automatically. No crash loop as described.
**Action**:
- [ ] Fix app so liveness probe fails during startup (causing actual crash loop)
- [ ] OR configure deployment to use wrong probe endpoint

#### 4. volume-conflict (5/20)
**Issue**: No broken state - StatefulSet creates separate PVCs per pod, no conflict.
**Action**:
- [ ] Redesign to create actual volume conflict scenario
- [ ] OR use shared PVC with multiple pods

#### 5. persistent-data (8/20)
**Issue**: ArgoCD deploys solved state (volume already mounted). Validation doesn't test persistence.
**Action**:
- [ ] Fix ArgoCD to deploy broken state (no volume mount)
- [ ] Add validation that tests data survives pod restart

#### 6. cert-mismatch (9/20)
**Issue**: Validation only checks pod Ready. User can submit immediately without fixing TLS.
**Action**:
- [ ] Add HTTPS connectivity validation
- [ ] Use curl test pod to verify certificate

#### 7. traffic-jam (10/20)
**Issue**: Requires ingress-nginx controller which doesn't exist.
**Action**:
- [ ] Install ingress-nginx in cluster setup
- [ ] OR remove/modify ingress validation
- [ ] Remove spoiler comment in deployment.yaml

---

### HIGH: Bypassable/Broken Validation (2)

#### 8. partial-outage (12/20)
**Issue**: User can delete NetworkPolicy entirely instead of adding allow rules.
**Action**:
- [ ] Add Kyverno policy to prevent NetworkPolicy deletion
- [ ] Add validation that NetworkPolicy with allow rules exists

#### 9. env-config (14/20)
**Issue**: Uses `type: condition` which is invalid. CLI fails to validate.
**Action**:
- [ ] Change `type: condition` to `type: status`
- [ ] Remove solution hint comment in deployment.yaml
- [ ] Add Kyverno policy to enforce ConfigMap usage

---

### MEDIUM: Minor Issues (1)

#### 10. tainted-out (14/20)
**Issues**:
- Race condition: deployment applies before taint job completes
- User can remove node taint instead of adding toleration
- Solution spoiler in manifest
**Action**:
- [ ] Fix sync-wave ordering
- [ ] Add Kyverno policy to prevent taint removal
- [ ] Remove comment from deployment.yaml

---

### LOW: Polish (4)

#### 11. first-job (15/20)
- Description gives away exact solution (busybox, sleep, output string)

#### 12. stuck-pending (16/20)
- Description mentions "node selection" but issue is taints
- Log validation timeout too short

#### 13. wrong-selector (16/20)
- Title "wrong-selector" spoils the solution

#### 14. access-pending (17/20)
- Kyverno policy references wrong image
- Description too helpful for "hard" difficulty

---

## Detailed Results

### Excellent (18-20/20)

| Challenge | Score | Notes |
|-----------|-------|-------|
| pod-evicted | 18/20 | Good mystery, teaches OOM debugging |
| missing-credentials | 18/20 | Good investigation flow |
| expose-internally | 18/20 | Clear learning objective |
| grant-access | 18/20 | Teaches RBAC well |
| job-failed | 18/20 | Good deadline debugging |

### Good (15-17/20)

| Challenge | Score | Notes |
|-----------|-------|-------|
| first-deployment | 17/20 | Good starter challenge |
| access-pending | 17/20 | Teaches RBAC, minor policy issue |
| privilege-denied | 17/20 | Good PSS learning |
| stuck-pending | 16/20 | Good taint/toleration learning |
| wrong-selector | 16/20 | Title spoils solution |
| first-job | 15/20 | Too prescriptive |

### Needs Work (12-14/20)

| Challenge | Score | Notes |
|-----------|-------|-------|
| tainted-out | 14/20 | Race condition, bypassable |
| env-config | 14/20 | Validation type broken |
| partial-outage | 12/20 | Trivially bypassable |

### Broken (<12/20)

| Challenge | Score | Notes |
|-----------|-------|-------|
| traffic-jam | 10/20 | Missing ingress controller |
| cert-mismatch | 9/20 | No TLS validation |
| persistent-data | 8/20 | Wrong deployed state |
| healthy-app | 5/20 | Passes without action |
| probes-drift | 5/20 | No actual crash loop |
| volume-conflict | 5/20 | No conflict exists |
| tls-ingress | 4/20 | No validation, no ingress |

---

## Statistics

- **Functional (OK)**: 11/21 (52%)
- **Needs Work**: 3/21 (14%)
- **Broken**: 7/21 (33%)

**Score Distribution**:
- 18-20: 5 challenges
- 15-17: 6 challenges
- 12-14: 3 challenges
- <12: 7 challenges
