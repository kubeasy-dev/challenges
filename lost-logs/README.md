# Lost Logs

**Theme:** Observability & Debugging
**Difficulty:** Beginner
**Estimated Time:** 15 minutes

## Challenge Description

The application is running, but logs are missing when trying to debug issues. Some containers show logs, others don't.

## Initial Situation

A multi-container pod is deployed with a main application and a sidecar logger. The main application runs fine and you can see its logs with kubectl logs. However, the sidecar container writes logs to a file instead of stdout. When you try to check the sidecar logs, nothing appears.

## Objective

Fix the logging configuration so all container logs are visible via kubectl logs. Ensure logs are written to stdout/stderr following 12-factor app principles.

## Learning Outcomes

After completing this challenge, you will understand:
- How Kubernetes captures container logs
- The importance of stdout/stderr for logging
- 12-factor app principle: logs as streams
- Multi-container pod logging patterns
- Using `kubectl logs` with multiple containers

## Files

- `manifests/deployment.yaml` - Multi-container deployment with logging issue
- `static/` - Validation rules
- `policies/` - Anti-bypass policies

## Getting Started

Deploy the challenge:
```bash
kubectl apply -f manifests/
```

Check logs from both containers:
```bash
kubectl logs <pod-name> -c app
kubectl logs <pod-name> -c logger
```

## Hints

<details>
<summary>Click for hint 1</summary>

One container logs to stdout (visible), another writes to a file (not visible).
</details>

<details>
<summary>Click for hint 2</summary>

Kubernetes can only capture logs written to stdout or stderr.
</details>

<details>
<summary>Click for hint 3</summary>

Remove file redirection (`>>`) from the logger container's command.
</details>
