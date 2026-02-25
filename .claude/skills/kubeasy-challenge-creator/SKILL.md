---
name: kubeasy-challenge-creator
description: >
  Create, validate, and submit Kubeasy challenges — interactive Kubernetes learning scenarios
  where users debug broken clusters. Use this skill whenever the user mentions Kubeasy challenges,
  wants to create Kubernetes learning exercises, asks about challenge.yaml files, or wants to
  generate challenges for the Kubeasy platform. Also trigger when the user says "create a challenge",
  "new challenge", "kubeasy", or references challenge themes like networking, RBAC, volumes, scheduling.
  This skill handles the full lifecycle: ideation, scaffolding with `kubeasy-cli dev create`, YAML
  validation with `kubeasy-cli dev lint`, local deployment with `kubeasy-cli dev apply`, testing with
  `kubeasy-cli dev test`, and iterating until the challenge is solid. Always use the Kubeasy MCP server
  to fetch existing challenges and avoid duplicates.
---

# Kubeasy Challenge Creator

This skill creates high-quality Kubeasy challenges — self-contained, broken Kubernetes scenarios
that learners must investigate and fix using real tools like `kubectl`.

## Step 0: Verify Cluster Context

Before anything, check if the `kind-kubeasy` Kubernetes context exists and is active:

```bash
# Check if context exists
kubectl config get-contexts kind-kubeasy 2>/dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: kind-kubeasy context not found. Run 'kubeasy setup' first."
  exit 1
fi

# Switch to it if not already current
CURRENT=$(kubectl config current-context 2>/dev/null)
if [ "$CURRENT" != "kind-kubeasy" ]; then
  kubectl config use-context kind-kubeasy
fi

# Verify cluster is reachable
kubectl cluster-info --context kind-kubeasy
```

If `kind-kubeasy` context does not exist → **stop immediately**. Tell the user to run
`kubeasy setup` first (requires `KUBEASY_API_KEY`). Do NOT attempt to create the cluster.

Commands that work without a cluster: `dev create`, `dev get`, `dev lint`.
Commands that require the cluster: `dev apply`, `dev validate`, `dev test`, `dev status`, `dev logs`, `dev clean`.

## Before You Start — Gather Context from MCP

**Always begin by querying the Kubeasy MCP server:**

1. `get_challenges` (no filters) → see ALL existing challenges to avoid duplicates
2. `get_challenges_themes` → get valid theme slugs
3. `get_challenges_types` → get valid types (fix, build, migrate)
4. `get_challenge_schema` → get the JSON schema for challenge.yaml validation

Do NOT skip this step. It is essential for creating original, non-duplicate challenges.

## Core Principles

### 1. Mystery Preserving (THE #1 RULE)
Descriptions show **symptoms**, never causes. Objectives check **outcomes**, never implementations.

```yaml
# BAD — reveals the problem
description: "The ConfigMap has invalid JSON syntax."
objective: "Increase the memory limit to 256Mi."
title: "Memory Limit Set to 128Mi"

# GOOD — maintains mystery
description: "A microservice keeps crashing shortly after deployment. The team swears the code hasn't changed."
objective: "Make the pod run stably without being evicted."
title: "Stable Operation"
```

### 2. One Concept Per Challenge
Never mix unrelated issues.

### 3. Realistic Scenarios
Mirror real production problems, not artificial puzzles.

### 4. Validate Outcomes, Not Implementations
Check "Pod is healthy" not "Memory is 256Mi". This allows multiple valid solutions.

## Challenge Structure

```
<challenge-slug>/
├── challenge.yaml      # Metadata, description, AND objectives
├── manifests/          # Initial broken state (Kubernetes YAML)
│   ├── deployment.yaml
│   └── ...
├── policies/           # Kyverno policies (prevent bypasses)
│   └── protect.yaml
└── image/              # Optional: custom Docker image
    ├── Dockerfile
    └── app.py
```

For the full JSON schema and all 5 validation types (condition, status, log, event, connectivity),
read `references/schema-and-validation.md`.

## Workflow — `kubeasy-cli dev` Commands

Here is the reference of all dev commands:

| Command        | Role                            | Cluster needed |
|----------------|---------------------------------|:--------------:|
| `dev create`   | Scaffold a new challenge        | No             |
| `dev get`      | Display local challenge metadata| No             |
| `dev lint`     | Validate YAML structure         | No             |
| `dev apply`    | Deploy local manifests          | Yes            |
| `dev validate` | Run validations                 | Yes            |
| `dev test`     | Apply + validate in one step    | Yes            |
| `dev status`   | Show pods + events              | Yes            |
| `dev logs`     | Stream pod logs                 | Yes            |
| `dev clean`    | Remove challenge resources      | Yes            |

### Step 1: Analyze Gaps

After fetching existing challenges from MCP, identify:
- Which themes have few challenges?
- Which difficulty levels are underrepresented?
- Which types (fix/build/migrate) need more?
- What common production scenarios aren't covered?

Propose challenge ideas to the user.

### Step 2: Scaffold — `kubeasy-cli dev create`

```bash
mkdir -p /home/claude/challenges && cd /home/claude/challenges

kubeasy-cli dev create \
  --name "My Challenge Title" \
  --type fix \
  --theme networking \
  --difficulty medium \
  --estimated-time 20
```

Flags: `--name`, `--slug`, `--type`, `--theme`, `--difficulty`, `--estimated-time`, `--with-manifests`

### Step 3: Fill in Content

Edit the generated files:

1. **`challenge.yaml`** — Fill description, initialSituation, objective, objectives
2. **`manifests/*.yaml`** — Create the broken Kubernetes resources
3. **`policies/protect.yaml`** — Kyverno bypass protection

**⚠️ NO SPOILER COMMENTS in manifests or policies.**
Learners can see all YAML comments via `kubectl get -o yaml`.
Never write comments that reveal the root cause, the fix, or hint at the solution.
Bad: `# TODO: memory limit too low` / `# Bug: wrong port` / `# This label is intentionally wrong`
OK: `# Application configuration` / `# Kyverno: protect base image to preserve scenario`

### Step 4: Lint — `kubeasy-cli dev lint`

Validate structure without a cluster:

```bash
kubeasy-cli dev lint <slug> --dir /home/claude/challenges
```

Fix ALL errors before proceeding.

### Step 5: Review metadata — `kubeasy-cli dev get`

```bash
cd /home/claude/challenges && kubeasy-cli dev get <slug>
```

Verify: title, type, theme, difficulty, objectives table all look correct.

### Step 6: Feedback Loop — Deploy, Test, Audit, Iterate (requires cluster)

This is the most important step. It's a structured loop that validates not just that the
challenge "works", but that it teaches the right thing.

If a cluster is set up (via `kubeasy setup`):

#### 6a. Deploy the broken state

```bash
cd /home/claude/challenges
kubeasy-cli dev apply <slug> --clean
kubeasy-cli dev status <slug>
kubeasy-cli dev logs <slug>
```

#### 6b. Verify validations FAIL

```bash
kubeasy-cli dev validate <slug>
```

All objectives MUST fail. This confirms the broken state is real.
If some objectives already pass → the broken state isn't broken enough. Fix the manifests.

#### 6c. Apply the fix (as a learner would)

Now act as the learner: investigate the problem using `kubectl`, then apply the fix.
Use `kubectl` commands to fix the issue (patch, edit, create resources, etc.).

```bash
# Example: fix a resource limit
kubectl patch deployment data-processor -n <slug> \
  --type='json' -p='[{"op":"replace","path":"/spec/template/spec/containers/0/resources/limits/memory","value":"128Mi"}]'
```

#### 6d. Verify validations PASS

```bash
kubeasy-cli dev validate <slug>
```

All objectives should now pass.

#### 6e. AUDIT — The Critical Step

This is where most challenge quality issues are caught. Ask yourself:

> "Did the actions I took to make validations pass actually require understanding
> the educational concept of this challenge?"

**Check each action against the learning objective:**

| Question | If NO → Action |
|---|---|
| Did fixing this require understanding the intended K8s concept? | Tighten Kyverno policies to block the shortcut |
| Could a user pass validations by doing something unrelated to the concept? | Add more specific validators or tighten policies |
| Are the Kyverno policies loose enough that a user could bypass the learning? | Add rules to protect the educational frame |
| Is there a trivial shortcut (delete & recreate, replace image, etc.)? | Add Kyverno rules to block it |
| Could the validations pass by accident or with a brute-force approach? | Make validators more specific |
| Is the concept actually teachable with the available validators? | Flag as missing validator (see section below) |
| Is the challenge fundamentally flawed — no way to enforce the learning? | **Delete the challenge entirely** |

**Possible outcomes of the audit:**

1. **✅ Challenge is solid** — The fix requires understanding the concept, policies block shortcuts,
   validators correctly check outcomes. Move to output.

2. **🔧 Tighten validators** — The fix works but validations are too loose. A user could pass
   with a wrong approach. Add more specific objectives or adjust existing ones.

3. **🔒 Tighten Kyverno policies** — A shortcut exists that bypasses the learning.
   Add policy rules to block it. Then re-run the loop from 6a.

4. **🗑️ Delete the challenge** — The concept can't be properly enforced with available
   validators and policies. The challenge would teach nothing. Remove it and move on.
   Don't waste time on unsalvageable challenges.

#### 6f. Iterate

If you tightened validators or policies (outcomes 2 or 3), go back to **6a** and re-run
the entire loop. The loop ends only when the audit passes cleanly.

```
┌─→ Deploy broken state (6a)
│   ↓
│   Verify validations FAIL (6b)
│   ↓
│   Apply fix as learner (6c)
│   ↓
│   Verify validations PASS (6d)
│   ↓
│   AUDIT actions vs learning objective (6e)
│   ↓
│   ├─ ✅ Solid → Exit loop → Step 7
│   ├─ 🔧 Tighten validators → loop back to 6a
│   ├─ 🔒 Tighten policies → loop back to 6a
│   └─ 🗑️ Unsalvageable → Delete challenge
└───────────────────────────────────┘
```

### Step 7: Clean up

```bash
kubeasy-cli dev clean <slug>
```

### Step 8: Output

Copy the challenge to `/mnt/user-data/outputs/` and present with `present_files`.

## Missing Validators or Options

The 5 existing validation types (condition, status, log, event, connectivity) cover many scenarios
but not everything. When designing a challenge, you may realize that the ideal validation would
require a validator type that doesn't exist yet, or an option on an existing validator that isn't
supported.

**When this happens, DO NOT silently drop the challenge idea or work around it with a weaker validation.**

Instead:

1. **Create the challenge anyway** with the best available validations (even if imperfect)
2. **Clearly flag the gap to the user** with a dedicated section in your output, formatted like:

```
⚠️ MISSING VALIDATOR REQUEST

Challenge: <challenge-slug>
Idea: <brief description of the challenge concept>

What's needed:
- <description of the missing validator type or option>
- Example: "A 'spec' validator that checks arbitrary fields in .spec (not .status),
  e.g. verify that a Deployment has exactly 3 replicas in its spec"
- Example: "A 'not-exists' option on the condition validator to check that a
  resource does NOT have a specific condition"

Current workaround: <what validation is used instead, and why it's not ideal>
```

3. **Collect all missing validator requests** when generating multiple challenges in batch,
   and present them as a consolidated list at the end so the user can prioritize implementation.

This is important because the user (the Kubeasy maintainer) wants to know about these gaps
to improve the platform. A challenge idea should never be silently abandoned — flag it and let
the user decide whether to implement the missing validator or adjust the challenge design.

## Kyverno Policies — Protecting the Educational Frame

Kyverno policies are NOT just about "preventing cheating". Their real purpose is to **lock the
immutable frame of the challenge** — the elements that define the learning constraint. If a user
can change these elements, they bypass the educational value entirely.

### How to Think About It

For each challenge, ask yourself:

> "What is the constraint that forces the user to learn the intended concept?
> If the user changed X, would they solve the problem without understanding anything?"

**That X is what you protect.**

### Examples of Reasoning

| Challenge concept | Educational constraint | What to protect |
|---|---|---|
| OOMKilled pod | The app genuinely needs more memory than the limit allows | The container image (so they can't replace with a lighter app) |
| Broken liveness probe | The probe path is wrong for this specific app | The container image + port (so they can't add a `/healthz` endpoint) |
| Network policy blocks traffic | Traffic must flow between specific pods | The network policy's `podSelector` and pod labels (so they can't just delete the policy by relabeling pods) |
| RBAC missing permissions | A ServiceAccount needs specific permissions | The ServiceAccount name + the app's SA reference (so they can't switch to a privileged SA) |
| Secret not mounted | The app expects env vars from a Secret | The container image + env var names it expects (so they can't hardcode values) |
| Wrong storage class | A PVC needs a specific provisioner | The PVC's storage requirements (so they can't just use emptyDir) |

### What to Protect vs What to Leave Open

**Protect (immutable frame):**
- Container images — prevents replacing the app with a trivial one
- Elements that define the broken scenario (the specific misconfiguration the user must discover)
- Labels and selectors that validations depend on (otherwise validations can't find resources)
- Resources that define the constraint (e.g., a NetworkPolicy that the user must fix, not delete)

**Leave open (the user's solution space):**
- Whatever the user needs to change to solve the challenge
- Resource limits/requests (if the challenge is about resource tuning)
- Probe configurations (if the challenge is about fixing probes)
- Environment variables (if the challenge is about ConfigMap/Secret injection)
- RBAC objects like Roles/RoleBindings (if the challenge is about granting permissions)

The boundary between "protect" and "leave open" depends entirely on the challenge concept.
A probe challenge protects the image but leaves probes open. A resource challenge protects
the image but leaves limits open. Think about it case by case.

### Policy Template

Policies are **namespaced** (not ClusterPolicy) and live in the challenge namespace
(which is the challenge slug). They are placed in `policies/` alongside manifests.

```yaml
apiVersion: kyverno.io/v1
kind: Policy
metadata:
  name: protect-<challenge-slug>
  namespace: <challenge-slug>
spec:
  validationFailureAction: Enforce
  rules:
    # Rule 1: Always protect the container image
    - name: preserve-image
      match:
        resources:
          kinds: ["Deployment"]
          names: ["<resource-name>"]
      validate:
        message: "Cannot change the application image"
        pattern:
          spec:
            template:
              spec:
                containers:
                  - name: <container-name>
                    image: "<image:tag>"

    # Rule 2: Protect challenge-specific constraints (example: protect a NetworkPolicy selector)
    # - name: preserve-network-constraint
    #   match:
    #     resources:
    #       kinds: ["NetworkPolicy"]
    #       names: ["<policy-name>"]
    #   validate:
    #     message: "Cannot change the network policy target"
    #     pattern:
    #       spec:
    #         podSelector:
    #           matchLabels:
    #             app: "<app-name>"
```

The namespace is always the challenge slug (e.g., `broken-probe`, `pod-evicted`).
No need to match on `namespaces: ["challenge-*"]` since the Policy is already scoped
to its own namespace.

When writing policies, add a YAML comment explaining WHY each rule exists:
```yaml
# Protects the image so the user must fix the probe path
# rather than replacing nginx with an image that has /healthz
```


## Quality Checklist

Before delivering any challenge:

- [ ] `kubeasy-cli dev lint` passes with 0 errors
- [ ] `kubeasy-cli dev get` shows correct metadata
- [ ] Description describes symptoms, NOT causes
- [ ] Objective states goals, NOT methods
- [ ] Validation titles are generic (don't reveal solutions)
- [ ] Manifests are minimal and realistic
- [ ] Kyverno policies protect images and critical config
- [ ] No duplicate of existing challenge (checked via MCP)
- [ ] Difficulty is appropriate for the complexity
- [ ] Estimated time is realistic
- [ ] Uses stable, common container images
- [ ] One focused concept per challenge
- [ ] If cluster available: `kubeasy-cli dev test --clean` confirms broken state, and validations pass after fix