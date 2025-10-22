/**
 * Challenge validation module
 * Provides schema validation for challenge data
 */

// Challenge schema definition
const challengeSchema = {
  title: { type: 'string', required: true, maxLength: 255 },
  description: { type: 'string', required: true },
  theme: { type: 'string', required: true },
  difficulty: {
    type: 'string',
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  estimated_time: { type: 'number', required: true, min: 1 },
  initial_situation: { type: 'string', required: true },
  objective: { type: 'string', required: true },
  of_the_week: { type: 'boolean', required: false }
};

/**
 * Validates that a theme exists using the API
 * Note: Theme validation is now handled by the sync API endpoint
 * This function is kept for backward compatibility but always returns true
 * @param {string} themeSlug - The theme slug to validate
 * @returns {Promise<boolean>} Always returns true (validation done by API)
 */
async function validateThemeExists(themeSlug) {
  // Theme existence validation is now handled by the sync API endpoint
  // The API will return an error if a theme doesn't exist
  return true;
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
    } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Field ${field} must be a boolean`);
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
