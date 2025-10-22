# Challenge Automation Scripts

This directory contains automation scripts for managing challenges in the Kubeasy project.

## Scripts Overview

### � validation.js
**Purpose**: Core validation module for challenge schema validation

**Features**:
- Defines the challenge schema with all required and optional fields
- Provides `validateChallenge()` function for data validation
- Reusable module imported by other scripts
- Type checking, constraint validation, and enum validation

**Usage as module**:
```javascript
const { validateChallenge, challengeSchema } = require('./validation');
const errors = validateChallenge(challengeData);
```

### 🔍 validate-challenges.js
**Purpose**: CLI script for validating challenge files with detailed reporting

**Features**:
- Validates YAML syntax and schema compliance
- Provides quality warnings for better challenges
- Detailed error reporting and suggestions
- Supports multiple input formats

**Usage**:
```bash
# Validate a single challenge
node validate-challenges.js "access-pending"

# Validate multiple challenges (space-separated)
node validate-challenges.js "access-pending partial-outage"

# Validate multiple challenges (JSON array)
node validate-challenges.js '["access-pending", "partial-outage"]'
```

### 🔄 sync.js
**Purpose**: Synchronizes all challenges with the Kubeasy API

**Features**:
- Automatically scans for all challenge folders
- Uses validation module to ensure data quality before sync
- Bulk sync operation using the admin API endpoint
- Supports create, update, and delete operations in a single call
- Provides detailed operation reports
- Validate-only mode for CI/CD checks

**Usage**:
```bash
# Sync all challenges to the API
node sync.js sync

# Only validate challenges without syncing
node sync.js validate
```

**Environment Variables**:
- `API_URL`: The Kubeasy API URL (default: https://kubeasy.dev)
- `API_TOKEN`: Admin API token (required for sync mode)

### 🏷️ create-github-resources.js
**Purpose**: Creates GitHub labels and discussions for new challenges

**Features**:
- Creates thematic labels for challenges
- Generates GitHub discussions with structured content
- Links challenges to community engagement
- Provides error handling and rollback

**Usage**:
```bash
# Create resources for a single challenge
node create-github-resources.js "access-pending"

# Create resources for multiple challenges
node create-github-resources.js "access-pending partial-outage"
```

**Environment Variables**:
- `GITHUB_TOKEN`: GitHub personal access token with repo and discussions permissions

## Architecture

```
validation.js          # Core validation module
├── validate-challenges.js  # Uses validation for CLI validation
└── sync.js            # Uses validation before database sync
```

This separation ensures:
- **Reusability**: The validation logic is shared between scripts
- **Maintainability**: Schema changes only need to be made in one place
- **Consistency**: All scripts use the same validation rules

## Input Format Standardization

All scripts accept input in three formats:

1. **Single challenge**: `"challenge-name"`
2. **Space-separated list**: `"challenge1 challenge2 challenge3"`
3. **JSON array**: `'["challenge1", "challenge2", "challenge3"]'`

This standardization ensures consistency across all automation tools.

## Validation Schema

Challenges must conform to the following schema:

```yaml
title: string (required, max 255 chars)
description: string (required)
theme: string (required)
difficulty: enum (required, "easy"|"medium"|"hard")
estimated_time: number (required, min 1 minute)
initial_situation: string (required)
objective: string (required)
of_the_week: boolean (optional, default: false)
```

## Quality Checks

The validation system includes quality warnings for:

- Short or missing descriptions in `initial_situation` and `objective`
- Unusual estimated times (< 5 min or > 120 min)
- Missing manifests directory
- Empty manifests directory

## Dependencies

```json
{
  "@supabase/supabase-js": "^2.49.8",
  "js-yaml": "^4.1.0",
  "@octokit/rest": "^20.1.1"
}
```

## Error Handling

All scripts implement comprehensive error handling:

- **Validation errors**: Clear messages with field-specific feedback
- **Network errors**: Retry logic and graceful degradation
- **File system errors**: Path validation and permission checks
- **API errors**: Rate limiting and authentication handling

## Integration with CI/CD

These scripts are integrated into GitHub Actions workflows:

- **validate-challenges.yaml**: Runs validation on PR changes
- **sync-database.yaml**: Syncs validated challenges to database

## Development

To add new validation rules, modify the `challengeSchema` object in `validation.js`.

To extend sync functionality, update the database operations in `sync.js`.

For new GitHub integrations, enhance `create-github-resources.js` with additional API calls.