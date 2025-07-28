const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { createClient } = require("@supabase/supabase-js");
const { validateChallenge } = require("./validation");

const input = process.argv[2];
const operations = process.argv[3] || "sync";

if (!input) {
  console.error("Usage: node sync.js <challenge-folder|challenge-list> [operations]");
  process.exit(1);
}

if (!["sync", "delete"].includes(operations)) {
  console.error(`Invalid operation: ${operations}. Use 'sync' or 'delete'.`);
  process.exit(1);
}

// Parse input - can be a single challenge or a JSON array
let challenges = [];
try {
  // Try to parse as JSON array first
  challenges = JSON.parse(input);
} catch {
  // If not JSON, treat as single challenge
  challenges = [input];
}

// Filter out empty strings
challenges = challenges.filter(c => c && c.trim().length > 0);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to sync a single challenge
async function syncChallenge(folder) {
  console.log(`\n🔄 Processing challenge: ${folder}`);
  
  // The script is now in .github/scripts, so we need to go up 2 levels to access challenge folders
  const rootPath = path.resolve(__dirname, '../../');
  const filePath = path.join(rootPath, folder, "challenge.yaml");
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    let challenge;
    
    try {
      challenge = yaml.load(raw);
    } catch (yamlError) {
      throw new Error(`Invalid YAML format: ${yamlError.message}`);
    }

    // Validate challenge data
    const validationErrors = validateChallenge(challenge);
    if (validationErrors.length > 0) {
      throw new Error(`Validation errors:\n${validationErrors.join('\n')}`);
    }

    const payload = {
      slug: folder,
      title: challenge.title,
      description: challenge.description,
      theme: challenge.theme,
      difficulty: challenge.difficulty,
      estimated_time: challenge.estimated_time,
      initial_situation: challenge.initial_situation,
      objective: challenge.objective,
    };

    const { error } = await supabase
      .from("challenges")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      throw error;
    }

    console.log(`✅ Challenge "${payload.title}" synced to Supabase.`);
    return true;
  } catch (err) {
    console.error(`❌ Error syncing challenge ${folder}:`, err.message);
    return false;
  }
}

// Function to delete a single challenge
async function deleteChallenge(folder) {
  console.log(`\n🗑️  Processing challenge deletion: ${folder}`);
  
  try {
    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("slug", folder);

    if (error) {
      throw error;
    }

    console.log(`✅ Challenge "${folder}" deleted from Supabase.`);
    return true;
  } catch (err) {
    console.error(`❌ Error deleting challenge ${folder}:`, err.message);
    return false;
  }
}

// Main processing function
async function processChallenges() {
  console.log(`🚀 Starting ${operations} operation for ${challenges.length} challenge(s)...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const challenge of challenges) {
    const trimmedChallenge = challenge.trim();
    if (!trimmedChallenge) continue;
    
    let success;
    if (operations === "sync") {
      success = await syncChallenge(trimmedChallenge);
    } else if (operations === "delete") {
      success = await deleteChallenge(trimmedChallenge);
    }
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log(`\n❌ Some operations failed. Check the errors above.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All operations completed successfully!`);
    process.exit(0);
  }
}

// Run the main function
processChallenges();