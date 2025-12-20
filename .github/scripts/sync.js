const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { validateChallenge } = require("./validation");

// API configuration
const API_URL = process.env.API_URL
const API_TOKEN = process.env.API_TOKEN;

// Valid validation types for objectives
const VALID_TYPES = ["status", "log", "event", "metrics", "rbac", "connectivity"];

if (!API_TOKEN) {
  console.error("Missing API_TOKEN env variable");
  console.error("Set your admin API token: export API_TOKEN=your_token_here");
  process.exit(1);
}

/**
 * Scans the repository for all challenge folders
 * A valid challenge folder must contain a challenge.yaml file
 */
function findAllChallenges() {
  const rootPath = path.resolve(__dirname, '../../');
  const items = fs.readdirSync(rootPath, { withFileTypes: true });

  const challenges = [];

  for (const item of items) {
    // Skip hidden folders and non-directories
    if (!item.isDirectory() || item.name.startsWith('.')) {
      continue;
    }

    // Check if challenge.yaml exists
    const challengeYamlPath = path.join(rootPath, item.name, 'challenge.yaml');
    if (fs.existsSync(challengeYamlPath)) {
      challenges.push(item.name);
    }
  }

  return challenges;
}

/**
 * Converts a validation key to a human-readable title
 * e.g., "app-ready-check" -> "App Ready Check"
 */
function formatDisplayName(name) {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extracts objectives from validations array in challenge data
 */
function extractObjectives(folder, validations) {
  if (!validations || !Array.isArray(validations)) {
    return [];
  }

  const objectives = [];

  for (const validation of validations) {
    const key = validation.key;
    if (!key) {
      console.warn(`   ⚠️  ${folder}/challenge.yaml: validation missing 'key' field`);
      continue;
    }

    const type = validation.type;
    if (!type || !VALID_TYPES.includes(type)) {
      console.warn(`   ⚠️  ${folder}/challenge.yaml: validation '${key}' has invalid type '${type}'`);
      continue;
    }

    objectives.push({
      objectiveKey: key,
      title: validation.title || formatDisplayName(key),
      description: validation.description || null,
      category: type,
      displayOrder: validation.order || 0,
    });
  }

  // Sort by display order
  objectives.sort((a, b) => a.displayOrder - b.displayOrder);

  return objectives;
}

/**
 * Loads and validates a single challenge from its folder
 */
async function loadChallenge(folder) {
  const rootPath = path.resolve(__dirname, '../../');
  const filePath = path.join(rootPath, folder, "challenge.yaml");

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  let challenge;

  try {
    challenge = yaml.load(raw);
  } catch (yamlError) {
    throw new Error(`Invalid YAML format: ${yamlError.message}`);
  }

  // Validate challenge data
  const validationErrors = await validateChallenge(challenge);
  if (validationErrors.length > 0) {
    throw new Error(`Validation errors:\n${validationErrors.join('\n')}`);
  }

  // Extract objectives from validations in challenge.yaml
  const objectives = extractObjectives(folder, challenge.validations);

  return {
    slug: folder,
    title: challenge.title,
    description: challenge.description,
    theme: challenge.theme,
    difficulty: challenge.difficulty,
    estimatedTime: challenge.estimated_time,
    initialSituation: challenge.initial_situation,
    objective: challenge.objective,
    ofTheWeek: challenge.of_the_week || false,
    starterFriendly: challenge.starter_friendly || false,
    objectives,
  };
}

/**
 * Syncs all challenges to the API using the bulk sync endpoint
 */
async function syncChallenges(challenges) {
  const endpoint = `${API_URL}/challenges/sync`;

  console.log(`\n📡 Sending ${challenges.length} challenges to ${endpoint}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ challenges }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error (${response.status}): ${error.error || 'Unknown error'}\n${error.details || ''}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to API at ${API_URL}. Is the server running?`);
    }
    throw err;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`🚀 Kubeasy Challenge Sync Tool`);
  console.log(`   API: ${API_URL}\n`);

  // Find all challenge folders
  console.log(`🔍 Scanning for challenges...`);
  const challengeFolders = findAllChallenges();
  console.log(`   Found ${challengeFolders.length} challenge(s): ${challengeFolders.join(', ')}\n`);

  if (challengeFolders.length === 0) {
    console.log(`⚠️  No challenges found. Nothing to do.`);
    process.exit(0);
  }

  // Load and validate all challenges
  console.log(`📖 Loading and validating challenges...`);
  const challenges = [];
  const errors = [];

  for (const folder of challengeFolders) {
    try {
      const challenge = await loadChallenge(folder);
      challenges.push(challenge);
      const objectivesCount = challenge.objectives?.length || 0;
      console.log(`   ✅ ${folder}: ${challenge.title} (${objectivesCount} objectives)`);
    } catch (err) {
      errors.push({ folder, error: err.message });
      console.error(`   ❌ ${folder}: ${err.message}`);
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   ✅ Valid: ${challenges.length}`);
  console.log(`   ❌ Invalid: ${errors.length}`);

  if (errors.length > 0) {
    console.error(`\n❌ Cannot proceed with sync due to validation errors.`);
    console.error(`   Fix the errors above and try again.`);
    process.exit(1);
  }

  // Sync to API
  try {
    const result = await syncChallenges(challenges);

    console.log(`\n✅ Sync completed successfully!`);
    console.log(`   Created: ${result.created}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Deleted: ${result.deleted}`);

    if (result.details) {
      if (result.details.created.length > 0) {
        console.log(`\n   📝 Created challenges:`);
        result.details.created.forEach(slug => console.log(`      - ${slug}`));
      }
      if (result.details.updated.length > 0) {
        console.log(`\n   🔄 Updated challenges:`);
        result.details.updated.forEach(slug => console.log(`      - ${slug}`));
      }
      if (result.details.deleted.length > 0) {
        console.log(`\n   🗑️  Deleted challenges:`);
        result.details.deleted.forEach(slug => console.log(`      - ${slug}`));
      }
    }

    console.log(`\n🎉 All done!`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Sync failed:`, err.message);
    process.exit(1);
  }
}

// Run the main function
main();