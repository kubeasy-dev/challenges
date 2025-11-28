# Validation System Evolution

This document summarizes the evolution of Kubeasy's validation system.

## Current System (November 2025)

### CLI-Based Validation

Validations are now:
- **Defined in `challenge.yaml`** alongside metadata (single file per challenge)
- **Executed by the CLI** directly against the Kubernetes cluster
- **No Kubernetes CRDs** - pure CLI logic
- **No operator required** - simpler deployment

### Challenge Structure

```
challenge-name/
├── challenge.yaml      # Metadata + validations in ONE file
├── manifests/          # Initial K8s manifests
├── policies/           # Kyverno policies
└── image/              # Optional: custom images
```

### Validation Definition

```yaml
# In challenge.yaml
validations:
  - key: pod-ready-check
    title: "Pod Ready"
    description: "The application pod must be running"
    order: 1
    type: status
    spec:
      target:
        kind: Pod
        labelSelector:
          app: my-app
      conditions:
        - type: Ready
          status: "True"
```

### Validation Types

| Type | Purpose |
|------|---------|
| `status` | Check resource conditions (Pod Ready, etc.) |
| `log` | Find strings in container logs |
| `event` | Detect forbidden K8s events |
| `metrics` | Check pod metrics (restart count) |
| `rbac` | Test ServiceAccount permissions |
| `connectivity` | HTTP connectivity tests |

---

## Historical Versions

### Version 2: CRD-Based (October 2025)

Previously, validations were Kubernetes CRDs managed by an operator:

```
challenge-name/
├── challenge.yaml
├── manifests/
├── validations/        # REMOVED - was separate CRD files
│   ├── status.yaml     # StatusValidation CRD
│   └── log.yaml        # LogValidation CRD
└── ...
```

**Removed because:**
- Required operator deployment
- Complex CRD reconciliation
- Harder to test locally
- More moving parts to debug

### Version 1: Rego-Based (Pre-October 2025)

Originally used Rego policies with static/dynamic validation:

```
challenge-name/
├── challenge.yaml
├── manifests/
├── static/             # REMOVED - was Rego policies
│   └── rule.rego
├── dynamic/            # REMOVED - was runtime scripts
│   └── test.yaml
└── ...
```

**Removed because:**
- Rego is complex and hard to write
- Mixing policy language with K8s was confusing
- Difficult to provide good error messages

---

## Migration History

| Date | Change |
|------|--------|
| Pre-Oct 2025 | Rego-based static/dynamic validations |
| Oct 29, 2025 | Migrated to CRD-based validation types |
| Nov 2025 | Migrated to CLI-based validation with embedded definitions |

---

## Benefits of Current System

1. **Simplicity** - One `challenge.yaml` file contains everything
2. **No operator** - CLI handles all validation logic
3. **Easy testing** - Run validations locally without K8s CRDs
4. **Clear structure** - YAML is easy to read and write
5. **Type safety** - CLI validates schema before execution
6. **Better errors** - CLI provides detailed failure messages

---

## Deprecated Folders

The following folders are **no longer used** and can be deleted:
- `static/` - Old Rego-based validations
- `dynamic/` - Old runtime validations
- `validations/` - Old CRD files (separate from challenge.yaml)

All validation logic is now in `challenge.yaml` under the `validations` key.
