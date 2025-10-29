# Challenge Validation Migration Summary

This document summarizes the migration from legacy `StaticValidation` and `DynamicValidation` CRDs to the new specialized validation types.

## Migration Date

October 29, 2025

## New Validation CRD Types

The validation system now uses 6 specialized CRD types instead of generic static/dynamic validations:

1. **LogValidation** - Validates container logs contain expected strings
2. **StatusValidation** - Checks resource status conditions (Pod Ready, Deployment Available, etc.)
3. **EventValidation** - Detects forbidden Kubernetes events (BackOff, Evicted, OOMKilled, etc.)
4. **MetricsValidation** - Verifies pod/deployment metrics (restart count, replicas, etc.)
5. **RBACValidation** - Tests ServiceAccount permissions using SubjectAccessReview
6. **ConnectivityValidation** - Validates network connectivity between pods

## Directory Structure

Each challenge now follows this structure:

```
challenge-name/
├── challenge.yaml          # Challenge metadata
├── manifests/              # Initial Kubernetes manifests
├── policies/               # Kyverno policies (if any)
├── static/                 # DEPRECATED - Old StaticValidation CRDs
├── dynamic/                # DEPRECATED - Old DynamicValidation CRDs
└── validations/            # NEW - Specialized validation CRDs
    ├── pod-status.yaml
    ├── pod-logs.yaml
    └── ...
```

## Challenges Migrated

### Challenges with Dynamic Validations Converted

| Challenge | Old Checks | New Validations |
|-----------|------------|-----------------|
| **access-pending** | status, logs, rbac | StatusValidation, LogValidation, RBACValidation |
| **bad-config** | status, logs | StatusValidation, LogValidation |
| **job-failed** | status, logs | StatusValidation, LogValidation |
| **partial-outage** | status, logs | StatusValidation, LogValidation |
| **probes-drift** | status | StatusValidation |

### Challenges with New Validations Added

These challenges previously only had static validations. New dynamic validations have been added:

| Challenge | New Validations | Purpose |
|-----------|-----------------|---------|
| **lost-logs** | LogValidation | Verify logs are visible via stdout |
| **pod-evicted** | StatusValidation, EventValidation, MetricsValidation | Check no eviction events, pod is ready, low restart count |
| **privilege-denied** | StatusValidation, EventValidation | Verify pod starts without security violations |
| **secret-not-shared** | StatusValidation, LogValidation | Check pod accesses secret and connects to database |

### Special Cases (TODO)

| Challenge | Current Checks | Migration Plan |
|-----------|---------------|----------------|
| **traffic-jam** | endpoints, ingress | Need to use StatusValidation or custom implementation |
| **out-of-space** | volume status | Need to use StatusValidation for PVC.status.phase |

## Validation Examples

### LogValidation Example

```yaml
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: LogValidation
metadata:
  name: check-logger-stdout
spec:
  targetRef:
    kind: Pod
    labelSelector:
      matchLabels:
        app: web-app
  expectedStrings:
    - "Application log entry"
    - "Logger sidecar"
  containerName: logger
  sinceSeconds: 60
```

### StatusValidation Example

```yaml
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: StatusValidation
metadata:
  name: pod-ready-check
spec:
  targetRef:
    kind: Pod
    labelSelector:
      matchLabels:
        app: startup-app
  expectedConditions:
    - type: "Ready"
      status: "True"
```

### EventValidation Example

```yaml
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: EventValidation
metadata:
  name: no-oom-eviction
spec:
  targetRef:
    kind: Pod
    labelSelector:
      matchLabels:
        app: data-processor
  forbiddenEventReasons:
    - "Evicted"
    - "OOMKilled"
    - "FailedScheduling"
  sinceSeconds: 300
```

### MetricsValidation Example

```yaml
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: MetricsValidation
metadata:
  name: low-restart-count
spec:
  targetRef:
    kind: Pod
    labelSelector:
      matchLabels:
        app: data-processor
  metricChecks:
    - metric: restartCount
      operator: LessThan
      value: 3
```

### RBACValidation Example

```yaml
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: RBACValidation
metadata:
  name: role-permissions-check
spec:
  serviceAccountName: startup-checker
  permissions:
    - verb: list
      group: ""
      resource: pods
```

## Benefits of New Structure

1. **Better Separation of Concerns**: Each validation type has a specific purpose
2. **Clearer Error Messages**: Validation failures are easier to understand
3. **Type-Safe Controllers**: Each CRD has a dedicated controller with specific logic
4. **No More Rego**: Removed complex policy language in favor of declarative YAML
5. **Frontend Integration**: Frontend can display per-validation progress in real-time
6. **Scalability**: Easier to add new validation types in the future

## Backward Compatibility

- Old `static/` and `dynamic/` directories are kept for reference but are deprecated
- The operator no longer processes `StaticValidation` or `DynamicValidation` CRDs
- The CLI now looks for all 6 new validation types
- The backend stores validation results in a structured JSON format

## Next Steps

1. Test all migrated challenges end-to-end
2. Handle special cases (traffic-jam, out-of-space)
3. Remove old `static/` and `dynamic/` directories once migration is validated
4. Update challenge creation guidelines to use new validation types
