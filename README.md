# Kubeasy Challenges

This repository contains Kubernetes challenges for the Kubeasy platform. Each challenge simulates a real-world incident where users must investigate, diagnose, and fix issues using their Kubernetes knowledge.

## Philosophy

Kubeasy believes in **learning through discovery**. Our challenges:

- Put users in **realistic scenarios** without revealing the root cause
- Let users investigate using standard tools (`kubectl`, logs, events)
- Validate **outcomes**, not specific implementations
- Accept multiple valid solutions when possible

See [CHALLENGE_GUIDELINES.md](./CHALLENGE_GUIDELINES.md) for detailed design principles.

## Repository Structure

```
challenges/
├── .github/
│   ├── scripts/          # Sync script for database
│   │   └── sync.js       # Syncs challenges to PostgreSQL
│   └── workflows/        # GitHub Actions
├── access-pending/       # RBAC and permissions
├── bad-config/           # ConfigMap debugging
├── job-failed/           # Batch job troubleshooting
├── out-of-space/         # Storage and PVCs
├── partial-outage/       # Network policies
├── pod-evicted/          # Resource limits
├── privilege-denied/     # Security contexts
├── probes-drift/         # Health checks
├── secret-not-shared/    # Secrets management
├── service-unreachable/  # Service discovery
└── traffic-jam/          # Ingress routing
```

## Challenge Structure

Each challenge folder contains:

```
challenge-name/
├── challenge.yaml      # Metadata, description, AND validations
├── manifests/          # Initial K8s manifests (broken state)
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── policies/           # Kyverno policies (prevent bypasses)
│   └── protect.yaml
└── image/              # Optional: custom Docker images
    └── Dockerfile
```

### challenge.yaml Format

```yaml
title: Challenge Title
description: |
  Brief description of the symptoms (NOT the cause).
theme: category-name
difficulty: easy|medium|hard
estimated_time: 15
initial_situation: |
  What the user will find when starting.
objective: |
  What needs to be achieved (NOT how to do it).

validations:
  - key: unique-key
    title: "User-Friendly Title"
    description: "What this checks"
    order: 1
    type: status|log|event|metrics|rbac|connectivity
    spec:
      # Type-specific configuration
```

## Validation Types

| Type | Purpose | Checks |
|------|---------|--------|
| `status` | Resource conditions | Pod Ready, Deployment Available |
| `log` | Container logs | Expected strings present |
| `event` | K8s events | No forbidden events (OOMKilled, etc.) |
| `metrics` | Pod metrics | Restart count, replicas |
| `rbac` | Permissions | ServiceAccount can perform actions |
| `connectivity` | Network | HTTP requests succeed |

## Themes

| Theme | Description |
|-------|-------------|
| `rbac-security` | Permissions, roles, security contexts |
| `networking` | Services, ingress, network policies |
| `volumes-secrets` | Storage, ConfigMaps, Secrets |
| `resources-scaling` | Limits, requests, HPA |
| `monitoring-debugging` | Probes, logging, events |
| `pods-containers` | Pod and container lifecycle, configuration, health |
| `jobs-cronjobs` | Batch jobs, scheduled jobs, job failures |

## Synchronization

When changes are pushed to `main`, the sync script automatically:

1. Parses all `challenge.yaml` files
2. Extracts validations as objectives
3. Updates the PostgreSQL database via tRPC API
4. Creates GitHub labels and discussions

Run locally:
```bash
cd .github/scripts
npm install
API_URL=... API_TOKEN=... node sync.js
```

## Contributing

1. Create a folder with a descriptive slug (e.g., `dns-resolution-failure`)
2. Write `challenge.yaml` with metadata and validations
3. Add broken manifests in `manifests/`
4. Add Kyverno policies in `policies/` to prevent bypasses
5. Test locally with Kind
6. Submit a pull request

### Guidelines

- **Don't spoil the solution** in descriptions or validation titles
- **Validate outcomes**, not specific fixes
- **Protect critical resources** with Kyverno policies
- **Test the broken state** deploys correctly
- **Test the fix** actually passes validations

See [CHALLENGE_GUIDELINES.md](./CHALLENGE_GUIDELINES.md) for complete guidelines.

## Local Development

```bash
# Start local cluster
kubeasy init

# Deploy a challenge
kubeasy challenge start <slug>

# Submit solution
kubeasy challenge submit <slug>

# Reset challenge
kubeasy challenge reset <slug>
```

## Resources

- [Challenge Guidelines](./CHALLENGE_GUIDELINES.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kyverno Documentation](https://kyverno.io/docs/)
