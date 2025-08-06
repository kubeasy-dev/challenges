# Challenge Development Guidelines

This document provides recommendations for creating robust and effective Kubernetes challenges that prevent bypassing and ensure proper learning outcomes.

## 1. Static Validation Requirements

### Required Components
Every challenge must include **both** components for static validation:

1. **ConfigMap with Rego rules** - Contains the validation logic
2. **StaticValidation object** - Links the ConfigMap to the target Kubernetes resource

### Example Structure
```yaml
# ConfigMap with Rego rules
apiVersion: v1
kind: ConfigMap
metadata:
  name: validation-rules
data:
  rule.rego: |
    package kubeasy.challenge
    violation[{"msg": msg}] {
      # Your validation logic here
      msg := "Error message"
    }

---
# StaticValidation object linking ConfigMap to target resource
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: StaticValidation
metadata:
  name: validate-resource
spec:
  target:
    apiVersion: v1  # API version of target resource
    kind: ConfigMap  # Kind of target resource
    name: target-name  # Name of target resource
  rulesConfigMap:
    name: validation-rules  # Name of ConfigMap with Rego rules
```

## 2. Container Image Selection

### Choose Images That Fail Appropriately
- **Bad example**: Using `nginx` for JSON validation (nginx doesn't care about JSON syntax)
- **Good example**: Using `python:3` with JSON validation command that will fail on invalid JSON

### Examples by Challenge Type
- **Configuration validation**: Use images that parse/validate the config format (Python for JSON, etc.)
- **Storage issues**: Use database images that require persistent storage to start
- **Network problems**: Use images with health checks that fail when services are unreachable

## 3. Bypass Prevention with Kyverno Policies

### Always Restrict Critical Components
Every challenge must prevent users from bypassing the intended learning path:

#### Container Image Restrictions
```yaml
- name: preserve-image
  match:
    resources:
      kinds: ["Deployment"]
      names: ["app-name"]
  validate:
    message: "Container image must be preserved"
    pattern:
      spec:
        template:
          spec:
            containers:
              - name: "container-name"
                image: "required-image:tag"
```

#### Volume Mount Preservation
```yaml
- name: preserve-volume-mount
  match:
    resources:
      kinds: ["Deployment"]
      names: ["app-name"]
  validate:
    message: "Volume mount configuration must be preserved"
    pattern:
      spec:
        template:
          spec:
            containers:
              - name: "*"
                volumeMounts:
                  - name: "volume-name"
                    mountPath: "/mount/path"
```

#### Resource Reference Protection
```yaml
- name: preserve-config-reference
  match:
    resources:
      kinds: ["Deployment"]
      names: ["app-name"]
  validate:
    message: "ConfigMap reference must be preserved"
    pattern:
      spec:
        template:
          spec:
            volumes:
              - name: "config-volume"
                configMap:
                  name: "config-name"
```

## 4. Kind (Local Kubernetes) Compatibility

### Storage Classes
- Use `rancher.io/local-path` provisioner instead of cloud-specific storage classes
- Avoid hardcoded storage class names unless the challenge specifically tests storage class issues

### Ingress Configuration
- Don't hardcode `ingressClassName` - let Kind use its default
- Test ingress paths work with Kind's ingress controller

### Resource Limits
- Keep resource requests/limits reasonable for local development
- Avoid GPU or specialized hardware requirements

## 5. Challenge Description Guidelines

### Maintain Mystery
- **Bad**: "The ConfigMap has invalid JSON syntax"
- **Good**: "Something went wrong during application startup"

### Focus on Investigation
- Provide minimal context about what's broken
- Let users discover the root cause through investigation
- Avoid mentioning specific technologies or configuration areas

### Realistic Scenarios
- Base challenges on real production issues
- Use meaningful application names and contexts
- Include reasonable resource configurations

## 6. Testing and Validation

### Before Submitting
1. **Deploy the challenge** in a local Kind cluster
2. **Verify the issue exists** - the application should fail as expected
3. **Test the fix** - ensure the intended solution resolves the issue
4. **Verify bypass prevention** - try to solve via unintended methods
5. **Check static validation** - ensure Rego rules detect the issue correctly

### Common Issues to Avoid
- Missing StaticValidation objects (only having ConfigMaps)
- Container images that don't exhibit the intended failure behavior
- Policies that don't prevent image or configuration bypasses
- Storage classes or ingress configurations incompatible with Kind
- Challenge descriptions that give away the solution

## 7. File Structure Checklist

Every challenge should have:
```
challenge-name/
├── challenge.yaml          # Challenge metadata and description
├── manifests/             # Kubernetes manifests with the issue
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── static/               # Static validation rules
│   ├── validation-configmap.yaml    # Rego rules
│   └── validation-object.yaml       # StaticValidation linking
├── dynamic/              # Runtime validation
│   └── test.yaml
└── policies/             # Kyverno policies preventing bypasses
    └── restrict-modifications.yaml
```

## 8. Review Checklist

Before submitting a challenge, verify:

- [ ] StaticValidation object exists and links to correct target resource
- [ ] ConfigMap with Rego rules exists and validates the intended issue
- [ ] Container images will fail in the intended way with the configuration issue
- [ ] Kyverno policies prevent changing container images
- [ ] Kyverno policies prevent bypassing volume mounts, config references, etc.
- [ ] Challenge works in Kind cluster (no cloud-specific dependencies)
- [ ] Challenge description is mysterious and doesn't spoil the solution
- [ ] All manifest files are free of spoiler comments
- [ ] Resource limits are appropriate for local development
- [ ] Challenge follows realistic DevOps/Platform Engineering scenarios