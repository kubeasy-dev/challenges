# Challenge Template

Use this template to create new challenges for the Kubeasy platform.

## 📁 Folder Structure

```
your-challenge-name/
├── challenge.yaml          # Required: Challenge metadata
├── manifests/             # Recommended: Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── image/                 # Optional: Custom Docker images
│   ├── Dockerfile
│   └── ...
├── policies/              # Optional: Admission controller policies
│   └── ...
└── static/               # Optional: Static validation files
    └── ...
```

## 📝 challenge.yaml Template

```yaml
title: Your Challenge Title
description: |
  Detailed description of what the challenge is about.
  Explain the scenario, what went wrong, or what needs to be implemented.
  Use multiple lines to provide context and background information.

theme: category-name  # e.g., rbac-security, networking, storage, observability
difficulty: beginner  # beginner | intermediate | advanced
estimated_time: 15    # Time in minutes (5-120 recommended)

initial_situation: |
  Describe the current state or what has happened.
  What is the starting point for the user?
  What tools/resources are already deployed?

objective: |
  Clearly state what the user needs to accomplish.
  What should be the end result?
  How will they know they've completed the challenge successfully?
```

## 🎯 Challenge Design Guidelines

### Good Practices

1. **Clear Learning Objective**: Each challenge should teach one specific concept
2. **Realistic Scenarios**: Base challenges on real-world problems
3. **Progressive Difficulty**: Build upon previous knowledge
4. **Self-Contained**: Include all necessary manifests and resources
5. **Testable**: Provide clear success criteria

### Metadata Guidelines

- **Title**: Descriptive but concise (2-4 words)
- **Description**: 2-3 sentences explaining the scenario
- **Theme**: Use existing themes or propose new ones
- **Difficulty**: 
  - `beginner`: Basic Kubernetes concepts
  - `intermediate`: Requires some experience 
  - `advanced`: Complex scenarios or deep knowledge
- **Estimated Time**: Realistic time for an average learner

### Content Guidelines

- **Initial Situation**: Set the scene, explain what exists
- **Objective**: Clear, measurable goals
- **Manifests**: Well-commented, production-like configurations
- **Documentation**: Include inline comments in YAML files

## ✅ Validation Checklist

Before submitting your challenge:

- [ ] `challenge.yaml` contains all required fields
- [ ] Title is descriptive and unique
- [ ] Description explains the scenario clearly
- [ ] Theme is appropriate and consistent
- [ ] Difficulty matches the complexity
- [ ] Estimated time is realistic (5-120 minutes)
- [ ] Initial situation provides context
- [ ] Objective is clear and measurable
- [ ] Manifests are included in `manifests/` directory
- [ ] YAML files are properly formatted
- [ ] Challenge can be completed as described

## 🚀 Submission Process

1. Create your challenge folder
2. Add all necessary files
3. Test locally: `node .github/scripts/validate-challenges.js "your-challenge"`
4. Submit a pull request
5. Address any validation feedback
6. Wait for review and merge

## 💡 Theme Examples

Common themes include:
- `rbac-security` - Role-based access control and security
- `networking` - Services, ingress, network policies
- `storage` - Persistent volumes, storage classes
- `observability` - Monitoring, logging, health checks
- `troubleshooting` - Debugging and problem resolution
- `deployment` - Application deployment and management
- `scaling` - Horizontal/vertical pod autoscaling
- `configuration` - ConfigMaps, secrets, environment variables

## 📚 Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kubeasy Platform](https://kubeasy.io)
- [Challenge Validation Schema](.github/scripts/validation.js)
