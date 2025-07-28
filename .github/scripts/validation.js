/**
 * Challenge validation module
 * Provides schema validation for challenge data
 */

const { createClient } = require("@supabase/supabase-js");

// Challenge schema definition
const challengeSchema = {
  title: { type: 'string', required: true, maxLength: 255 },
  description: { type: 'string', required: true },
  theme: { type: 'string', required: true },
  difficulty: { 
    type: 'string', 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced'] 
  },
  estimated_time: { type: 'number', required: true, min: 1 },
  initial_situation: { type: 'string', required: false },
  objective: { type: 'string', required: false }
};

/**
 * Validates that a theme exists in the database
 * @param {string} themeSlug - The theme slug to validate
 * @returns {Promise<boolean>} True if theme exists, false otherwise
 */
async function validateThemeExists(themeSlug) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Warning: SUPABASE_URL or SUPABASE_KEY not set, skipping theme validation");
    return true; // Skip validation if credentials not available
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data, error } = await supabase
      .from("themes")
      .select("slug")
      .eq("slug", themeSlug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.warn(`Warning: Error checking theme existence: ${error.message}`);
      return true; // Skip validation on database errors
    }

    return !!data; // Return true if theme found, false otherwise
  } catch (err) {
    console.warn(`Warning: Error validating theme: ${err.message}`);
    return true; // Skip validation on connection errors
  }
}

/**
 * Validates a challenge object against the schema
 * @param {Object} challenge - The challenge data to validate
 * @returns {Promise<Array>} Promise that resolves to array of validation error messages
 */
async function validateChallenge(challenge) {
  const errors = [];

  for (const [field, rules] of Object.entries(challengeSchema)) {
    const value = challenge[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`Field ${field} must be a string`);
    } else if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(`Field ${field} must be a number`);
    }

    // String length validation
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`Field ${field} exceeds maximum length of ${rules.maxLength}`);
    }

    // Number range validation
    if (rules.min && typeof value === 'number' && value < rules.min) {
      errors.push(`Field ${field} must be at least ${rules.min}`);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Field ${field} must be one of: ${rules.enum.join(', ')}`);
    }
  }

  // Special validation for theme field - check if it exists in database
  if (challenge.theme && typeof challenge.theme === 'string') {
    const themeExists = await validateThemeExists(challenge.theme);
    if (!themeExists) {
      errors.push(`Theme '${challenge.theme}' does not exist in the database`);
    }
  }

  return errors;
}

module.exports = { validateChallenge, validateThemeExists, challengeSchema };
