const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { createClient } = require("@supabase/supabase-js");

const folder = process.argv[2];
if (!folder) {
  console.error("Usage: node sync.js <folder>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const filePath = path.join(folder, "challenge.yaml");
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

(async () => {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const challenge = yaml.load(raw);

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
  } catch (err) {
    console.error("❌ Error syncing challenge:", err.message);
    process.exit(1);
  }
})();
