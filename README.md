# Kubeasy Challenges

This repository contains Kubernetes challenges for the Kubeasy platform. Each challenge is designed to teach specific Kubernetes concepts through hands-on exercises.

## Repository Structure

```
challenges/
├── .github/
│   ├── scripts/          # Synchronization scripts for Supabase
│   └── workflows/        # GitHub Actions workflows
├── access-pending/       # RBAC security challenge
├── partial-outage/       # Network policies challenge  
├── probes-drift/         # Health checks challenge
└── test-challenge/       # Example challenge structure
```

## Challenge Structure

Each challenge folder contains:

- `challenge.yaml` - Challenge metadata and description
- `manifests/` - Kubernetes manifests for the challenge
- `image/` - Custom Docker images (if needed)
- `policies/` - Admission controller policies
- `static/` - Static validation files
- `dynamic/` - Dynamic challenge components

## Challenge Metadata

Each `challenge.yaml` file must include:

```yaml
title: Challenge Title
description: |
  Detailed description of the challenge
theme: category-name
difficulty: beginner|intermediate|advanced
estimated_time: 15
initial_situation: |
  Description of the starting state
objective: |
  What the user needs to accomplish
```

## Synchronization

Challenges are automatically synchronized with the Supabase database when:
- A `challenge.yaml` file is added, modified, or deleted
- Changes are pushed to the `main` branch

The synchronization process:
1. Validates challenge data format
2. Updates the Supabase database
3. Creates GitHub labels for new challenges
4. Creates GitHub discussions for community interaction
5. Handles deletions automatically

## Development

To add a new challenge:

1. Create a new folder with a descriptive name
2. Add a `challenge.yaml` file with required metadata
3. Include necessary Kubernetes manifests
4. Test your challenge locally
5. Submit a pull request (validation will run automatically)

### Challenge Validation

All challenges are automatically validated when you create a pull request:

- **YAML syntax** - Ensures proper formatting
- **Required fields** - Validates all mandatory metadata
- **Data constraints** - Checks difficulty levels, estimated times, etc.
- **File structure** - Warns about missing manifests or content
- **Quality suggestions** - Provides recommendations for improvement

The validation will:
- ✅ Pass: Add a success comment to your PR
- ❌ Fail: Block the PR until issues are fixed

You can run validation locally:
```bash
cd .github/scripts
npm install
node validate-challenges.js "your-challenge-folder"
```

## Scripts

All automation scripts are located in `.github/scripts/`. See the [scripts README](.github/scripts/README.md) for more details.
