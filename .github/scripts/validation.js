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
    enum: ['beginner', 'intermediate', 'advanced'] 
  },
  estimated_time: { type: 'number', required: true, min: 1 },
  initial_situation: { type: 'string', required: false },
  objective: { type: 'string', required: false }
};

/**
 * Validates a challenge object against the schema
 * @param {Object} challenge - The challenge data to validate
 * @returns {Array} Array of validation error messages
 */
function validateChallenge(challenge) {
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

  return errors;
}

module.exports = { validateChallenge, challengeSchema };
