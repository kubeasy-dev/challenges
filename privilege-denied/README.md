# Privilege Denied

**Theme:** Security & RBAC
**Difficulty:** Intermediate
**Estimated Time:** 20 minutes

## Challenge Description

A legacy application that used to run with special privileges now fails to start. Security policies have been enforced, and the deployment needs updating.

## Initial Situation

A legacy application was deployed and worked fine initially. After implementing Pod Security Standards at the cluster level, the pod fails to start. The error message shows violations related to running as root and filesystem permissions. The deployment needs to be updated to comply with security policies.

## Objective

Update the deployment's SecurityContext to comply with Pod Security Standards. Make the application run as a non-root user and use a read-only root filesystem.

## Learning Outcomes

After completing this challenge, you will understand:
- Pod Security Standards (Privileged, Baseline, Restricted)
- SecurityContext at pod and container levels
- Running containers as non-root users
- Read-only root filesystems
- Linux capabilities
- AllowPrivilegeEscalation setting

## Files

- `manifests/deployment.yaml` - Initial deployment without security context
- `static/` - Validation rules
- `policies/` - Anti-bypass policies

## Getting Started

Deploy the challenge:
```bash
kubectl apply -f manifests/
```

Check the pod status and security violations:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

## Hints

<details>
<summary>Click for hint 1</summary>

The pod needs both pod-level and container-level securityContext configurations.
</details>

<details>
<summary>Click for hint 2</summary>

Set `runAsNonRoot: true` and `runAsUser: 1000` (or another non-zero UID).
</details>

<details>
<summary>Click for hint 3</summary>

With `readOnlyRootFilesystem: true`, you'll need to add an emptyDir volume for /tmp.
</details>

<details>
<summary>Click for hint 4</summary>

Drop all capabilities: `capabilities.drop: ["ALL"]`.
</details>
