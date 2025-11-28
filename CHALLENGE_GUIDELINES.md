# Challenge Development Guidelines

This document provides guidelines for creating effective Kubernetes challenges that maximize learning through realistic scenarios.

---

## Philosophy: Learning Through Discovery

Kubeasy's core belief is that **the best learning happens when users discover solutions themselves**. Our challenges simulate real-world incidents where something is broken, and users must investigate, diagnose, and fix the issue using their own reasoning and Kubernetes knowledge.

### Key Principles

1. **Realism Over Pedagogy**
   - Create scenarios that mirror actual production incidents
   - Don't artificially simplify problems to make them "educational"
   - Users should feel like they're debugging a real system, not completing a tutorial

2. **Mystery Preserving**
   - Never reveal the root cause in descriptions
   - Avoid hints that point directly to the solution
   - Let users experience the investigation process

3. **Autonomy First**
   - Users should solve challenges using standard Kubernetes tools (`kubectl`, logs, events)
   - Don't create artificial constraints that force a specific debugging path
   - Multiple valid solutions should be accepted when possible

4. **Failure Is Learning**
   - Users should be able to try wrong approaches safely
   - Repeated attempts build intuition
   - Clear feedback on what passed/failed without revealing the fix

---

## Challenge Design

### Description Guidelines

The challenge description sets the scene without spoiling the solution.

**Bad Example** (reveals too much):
```yaml
description: |
  The ConfigMap has invalid JSON syntax causing the pod to crash.
  Fix the JSON formatting error in the configuration.
```

**Good Example** (maintains mystery):
```yaml
description: |
  A microservice keeps crashing shortly after deployment.
  The team swears the code hasn't changed.
```

### Initial Situation

Describe what the user will find, not what's wrong:

**Bad**:
```yaml
initial_situation: |
  The deployment has incorrect resource limits set to 10Mi memory,
  which is too low for the application.
```

**Good**:
```yaml
initial_situation: |
  A data processing application is deployed as a single pod.
  The pod starts successfully but gets killed after a few seconds.
  It enters a CrashLoopBackOff state and keeps restarting.
```

### Objective

State the goal without the method:

**Bad**:
```yaml
objective: |
  Increase the memory limit to at least 256Mi.
```

**Good**:
```yaml
objective: |
  Make the pod run stably without being evicted.
  Understand why Kubernetes is killing the application.
```

---

## Validation Design

Validations verify the solution is correct. **They should confirm the fix worked, not guide users to the fix.**

### Golden Rule

> **A validation should check the outcome, not the specific implementation.**

### Validation Types

Each validation is defined in the `validations` section of `challenge.yaml`:

```yaml
validations:
  - key: unique-identifier
    title: "User-Friendly Title"
    description: "What this validation checks"
    order: 1
    type: status|log|event|metrics|rbac|connectivity
    spec:
      # Type-specific configuration
```

### Available Validation Types

| Type | Purpose | Example Use Case |
|------|---------|------------------|
| `status` | Check resource conditions | Pod is Ready, Deployment is Available |
| `log` | Find strings in container logs | "Connected to database", "Server started" |
| `event` | Detect forbidden K8s events | No OOMKilled, no Evicted events |
| `metrics` | Check pod/deployment metrics | Restart count < 3, replicas >= 2 |
| `rbac` | Test ServiceAccount permissions | Can create pods, can list secrets |
| `connectivity` | HTTP connectivity tests | Service responds with 200 |

### Validation Examples

#### Status Validation
```yaml
- key: pod-ready-check
  title: "Pod Ready"
  description: "The application pod must be running and healthy"
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

#### Log Validation
```yaml
- key: database-connection
  title: "Database Connected"
  description: "The application must successfully connect to the database"
  order: 2
  type: log
  spec:
    target:
      kind: Pod
      labelSelector:
        app: api-service
    expectedStrings:
      - "Connected to database successfully"
    sinceSeconds: 120
```

#### Event Validation
```yaml
- key: no-crashes
  title: "No Crash Events"
  description: "The pod should not experience any crash or eviction events"
  order: 3
  type: event
  spec:
    target:
      kind: Pod
      labelSelector:
        app: data-processor
    forbiddenReasons:
      - "OOMKilled"
      - "Evicted"
      - "BackOff"
    sinceSeconds: 300
```

#### Metrics Validation
```yaml
- key: low-restarts
  title: "Stable Operation"
  description: "The pod must not restart excessively"
  order: 4
  type: metrics
  spec:
    target:
      kind: Pod
      labelSelector:
        app: my-app
    metricChecks:
      - metric: restartCount
        operator: LessThan
        value: 3
```

#### RBAC Validation
```yaml
- key: sa-permissions
  title: "ServiceAccount Permissions"
  description: "The service account must have required permissions"
  order: 5
  type: rbac
  spec:
    serviceAccountName: my-service-account
    requiredPermissions:
      - resource: pods
        verb: list
      - resource: secrets
        verb: get
```

#### Connectivity Validation
```yaml
- key: service-reachable
  title: "Service Connectivity"
  description: "The service must be reachable from within the cluster"
  order: 6
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

---

## Validation Anti-Patterns

### Don't Reveal the Solution

**Bad** (tells user exactly what to check):
```yaml
- key: memory-limit-check
  title: "Memory Limit Increased"
  description: "Memory limit must be set to at least 256Mi"
```

**Good** (checks outcome, not implementation):
```yaml
- key: no-oom-events
  title: "No Memory Issues"
  description: "The pod must run without memory-related problems"
```

### Don't Be Too Specific

**Bad** (reveals configuration details):
```yaml
- key: probe-config
  title: "Liveness Probe Configured"
  description: "The liveness probe must use /healthz endpoint"
```

**Good** (checks that probes work):
```yaml
- key: pod-healthy
  title: "Pod Healthy"
  description: "The pod must pass all health checks"
```

### Validate Outcomes, Not Methods

**Bad** (forces specific implementation):
```yaml
- key: secret-mounted
  title: "Secret Volume Mount"
  description: "The secret must be mounted at /etc/credentials"
```

**Good** (checks the app works):
```yaml
- key: app-authenticated
  title: "Application Authenticated"
  description: "The application must successfully authenticate"
  type: log
  spec:
    expectedStrings:
      - "Authentication successful"
```

---

## Kyverno Policies

Use Kyverno policies to prevent users from bypassing the challenge entirely (e.g., replacing the broken application with a working one).

### What to Protect

- Container images (prevent replacing the app)
- Critical volume mounts (prevent removing problematic configs)
- Essential labels (ensure validations can find resources)

### Example Policy

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: protect-challenge-image
spec:
  validationFailureAction: Enforce
  rules:
    - name: preserve-image
      match:
        resources:
          kinds: ["Deployment"]
          names: ["my-app"]
          namespaces: ["challenge-*"]
      validate:
        message: "Cannot change the application image"
        pattern:
          spec:
            template:
              spec:
                containers:
                  - name: app
                    image: "kubeasy/broken-app:v1"
```

### What NOT to Protect

Don't over-constrain! Users should be able to:
- Modify resource limits/requests
- Add environment variables
- Change probe configurations
- Add/modify labels and annotations
- Scale deployments

---

## Challenge Structure

Each challenge folder should contain:

```
challenge-name/
├── challenge.yaml      # Metadata, description, AND validations
├── manifests/          # Initial Kubernetes manifests (broken state)
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── policies/           # Kyverno policies to prevent bypasses
│   └── protect.yaml
└── image/              # Optional: custom Docker images
    └── Dockerfile
```

### Complete challenge.yaml Example

```yaml
title: Pod Evicted
description: |
  A data processing pod keeps crashing and getting evicted.
  It was working fine yesterday, but now Kubernetes keeps killing it.
theme: resources-scaling
difficulty: easy
estimated_time: 15
initial_situation: |
  A data processing application is deployed as a single pod.
  The pod starts successfully but after a few seconds gets killed.
  It enters a CrashLoopBackOff state and keeps restarting.
  The application code hasn't changed recently.
objective: |
  Fix the pod so it can run without being evicted.
  Understand why Kubernetes is killing the application.

validations:
  - key: pod-running
    title: "Pod Ready"
    description: "The data-processor pod must be running and healthy"
    order: 1
    type: status
    spec:
      target:
        kind: Pod
        labelSelector:
          app: data-processor
      conditions:
        - type: Ready
          status: "True"

  - key: no-eviction
    title: "No Crash Events"
    description: "The pod should run stably without being killed"
    order: 2
    type: event
    spec:
      target:
        kind: Pod
        labelSelector:
          app: data-processor
      forbiddenReasons:
        - "Evicted"
        - "OOMKilled"
      sinceSeconds: 300
```

---

## Testing Checklist

Before submitting a challenge:

- [ ] Challenge deploys correctly in a Kind cluster
- [ ] The issue manifests as described (app fails as expected)
- [ ] The intended solution fixes the problem
- [ ] Alternative valid solutions also work (if applicable)
- [ ] Validations pass only when the issue is actually fixed
- [ ] Validations don't reveal the solution in titles/descriptions
- [ ] Kyverno policies prevent obvious bypasses
- [ ] Description maintains mystery about the root cause
- [ ] Estimated time is realistic

---

## Common Mistakes

1. **Solution in the title**: "Fix Memory Limit" → "Stable Operation"
2. **Too much context**: Explaining why something is broken
3. **Overly specific validations**: Checking exact config values
4. **Missing bypass protection**: Users can just delete and recreate resources
5. **Unrealistic scenarios**: Problems that would never happen in production
6. **Too many hints**: Step-by-step instructions instead of a goal

---

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kyverno Policy Documentation](https://kyverno.io/docs/)
- [Kubeasy Platform](https://kubeasy.dev)
