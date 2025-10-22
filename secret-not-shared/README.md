# Secret Not Shared

**Theme:** Security & Configuration
**Difficulty:** Intermediate
**Estimated Time:** 20 minutes

## Challenge Description

A microservice can't connect to the database because it's missing credentials. The Secret exists, but the pod doesn't have access to it.

## Initial Situation

A new microservice was deployed that needs to connect to a PostgreSQL database. The database credentials are stored in a Kubernetes Secret. The Secret exists and contains the correct username and password. However, the pod fails to start with an error: "DATABASE_PASSWORD environment variable not set".

## Objective

Fix the deployment configuration so the pod can access the database credentials from the Secret. The application expects credentials as environment variables: `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`.

## Learning Outcomes

After completing this challenge, you will understand:
- How to create and manage Kubernetes Secrets
- Different ways to expose Secrets (env vars vs volumes)
- Secret reference syntax (`valueFrom.secretKeyRef`)
- Security best practices for credentials
- Troubleshooting missing environment variables

## Files

- `manifests/secret.yaml` - Database credentials Secret
- `manifests/deployment.yaml` - Initial broken deployment
- `static/` - Validation rules
- `policies/` - Anti-bypass policies

## Getting Started

Deploy the challenge:
```bash
kubectl apply -f manifests/
```

Check the issue:
```bash
kubectl get pods
kubectl logs <pod-name>
```

Verify the Secret exists:
```bash
kubectl get secret database-credentials
```

## Hints

<details>
<summary>Click for hint 1</summary>

The Secret exists and has the right keys. Check how the deployment references it.
</details>

<details>
<summary>Click for hint 2</summary>

Look at the `env:` section in the deployment. Some variables are missing.
</details>

<details>
<summary>Click for hint 3</summary>

Use `valueFrom.secretKeyRef` to reference Secret keys as environment variables.
</details>
