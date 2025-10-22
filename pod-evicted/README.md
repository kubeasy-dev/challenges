# Pod Evicted

**Theme:** Resource Management
**Difficulty:** Beginner
**Estimated Time:** 15 minutes

## Challenge Description

A data processing pod keeps crashing and getting evicted. It was working fine yesterday, but now Kubernetes keeps killing it.

## Initial Situation

A data processing application is deployed as a single pod. The pod starts successfully but after a few seconds gets OOMKilled (Out of Memory). It enters a CrashLoopBackOff state and keeps restarting. The application code hasn't changed, but Kubernetes is now enforcing resource limits.

## Objective

Fix the resource configuration so the pod can run without being evicted. Understand the difference between requests and limits, and how Kubernetes manages resources.

## Learning Outcomes

After completing this challenge, you will understand:
- Resource requests vs limits
- Quality of Service (QoS) classes
- OOMKilled behavior and troubleshooting
- How to properly size resource limits
- Using `kubectl top` for resource monitoring

## Files

- `manifests/deployment.yaml` - Initial broken deployment
- `static/` - Validation rules
- `policies/` - Anti-bypass policies

## Getting Started

Deploy the challenge:
```bash
kubectl apply -f manifests/
```

Check the pod status:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

## Hints

<details>
<summary>Click for hint 1</summary>

Check the pod events and look for OOMKilled messages.
</details>

<details>
<summary>Click for hint 2</summary>

Compare the memory limit with what the application actually needs.
</details>

<details>
<summary>Click for hint 3</summary>

Use `kubectl edit deployment` to adjust resource limits.
</details>
