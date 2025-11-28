# Challenge Template

Use this template to create new challenges for Kubeasy.

## Folder Structure

```
your-challenge-name/
├── challenge.yaml      # Required: metadata + validations
├── manifests/          # Required: broken K8s manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── policies/           # Recommended: Kyverno bypass prevention
│   └── protect.yaml
└── image/              # Optional: custom Docker images
    └── Dockerfile
```

## challenge.yaml Template

```yaml
title: Your Challenge Title
description: |
  Describe the SYMPTOMS, not the cause.
  What is the user experiencing? What's broken?
  Keep it mysterious - don't reveal the solution.

theme: category-name  # rbac-security, networking, volumes-secrets, resources-scaling, monitoring-debugging
difficulty: medium    # easy | medium | hard
estimated_time: 15    # Minutes (5-60 recommended)

initial_situation: |
  Describe what the user will find.
  What's deployed? What state is it in?
  Focus on observations, not explanations.

objective: |
  What should the user achieve?
  State the goal, not the method.
  "Make the app work" not "Fix the ConfigMap"

validations:
  - key: unique-identifier
    title: "Outcome-Based Title"
    description: "What this validation checks (not how to fix it)"
    order: 1
    type: status  # status | log | event | metrics | rbac | connectivity
    spec:
      target:
        kind: Pod
        labelSelector:
          app: your-app
      conditions:
        - type: Ready
          status: "True"

  - key: another-validation
    title: "Another Check"
    description: "Second validation"
    order: 2
    type: log
    spec:
      target:
        kind: Pod
        labelSelector:
          app: your-app
      expectedStrings:
        - "Application started successfully"
      sinceSeconds: 120
```

## Validation Type Examples

### Status (check resource conditions)
```yaml
type: status
spec:
  target:
    kind: Pod  # or Deployment, StatefulSet, etc.
    labelSelector:
      app: my-app
  conditions:
    - type: Ready
      status: "True"
```

### Log (find strings in logs)
```yaml
type: log
spec:
  target:
    kind: Pod
    labelSelector:
      app: my-app
  expectedStrings:
    - "Connected to database"
    - "Server listening"
  sinceSeconds: 120
```

### Event (detect bad events)
```yaml
type: event
spec:
  target:
    kind: Pod
    labelSelector:
      app: my-app
  forbiddenReasons:
    - "OOMKilled"
    - "Evicted"
    - "BackOff"
  sinceSeconds: 300
```

### Metrics (check pod metrics)
```yaml
type: metrics
spec:
  target:
    kind: Pod
    labelSelector:
      app: my-app
  metricChecks:
    - metric: restartCount
      operator: LessThan  # LessThan, GreaterThan, Equals
      value: 3
```

### RBAC (test permissions)
```yaml
type: rbac
spec:
  serviceAccountName: my-sa
  requiredPermissions:
    - resource: pods
      verb: list
    - resource: secrets
      verb: get
```

### Connectivity (HTTP checks)
```yaml
type: connectivity
spec:
  sourcePod:
    labelSelector:
      app: client
  targets:
    - url: "http://backend-service:8080/health"
      expectedStatusCode: 200
      timeoutSeconds: 5
```

## Design Checklist

Before submitting:

- [ ] Description describes symptoms, NOT the cause
- [ ] Objective states the goal, NOT the solution
- [ ] Validation titles don't reveal what to fix
- [ ] Manifests deploy in broken state
- [ ] Kyverno policies prevent bypasses (image changes, resource deletion)
- [ ] Challenge works in Kind cluster
- [ ] Intended solution passes all validations

## Anti-Patterns to Avoid

**Don't reveal the solution:**
- Bad: "Fix the memory limit configuration"
- Good: "Make the pod run stably"

**Don't be too specific in validations:**
- Bad: `title: "Memory Limit Set to 256Mi"`
- Good: `title: "Stable Operation"`

**Don't explain why things are broken:**
- Bad: "The ConfigMap has a typo in the JSON"
- Good: "The application fails to start"

## Resources

- [Challenge Guidelines](../CHALLENGE_GUIDELINES.md)
- [Existing Challenges](../) for reference
