/**
 * Challenge validation module
 * Uses remote JSON schema as single source of truth
 */

const Ajv2020 = require("ajv/dist/2020");

// Remote schema URL - single source of truth
const SCHEMA_URL = "https://kubeasy.dev/api/schemas/challenge";

// Cache for the schema to avoid repeated fetches
let cachedSchema = null;

/**
 * Fetches the challenge schema from the remote URL
 * @returns {Promise<Object>} The JSON schema
 */
async function fetchRemoteSchema() {
  if (cachedSchema) {
    return cachedSchema;
  }

  try {
    const response = await fetch(SCHEMA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
    }
    cachedSchema = await response.json();
    return cachedSchema;
  } catch (error) {
    throw new Error(`Cannot fetch remote schema from ${SCHEMA_URL}: ${error.message}`);
  }
}

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
 * Validates a challenge object against the remote JSON schema
 * @param {Object} challenge - The challenge data to validate
 * @returns {Promise<Array>} Promise that resolves to array of validation error messages
 */
async function validateChallenge(challenge) {
  const errors = [];

  try {
    // Fetch the remote schema
    const schema = await fetchRemoteSchema();

    // Create Ajv2020 instance with support for formats and defaults
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      useDefaults: true
    });

    // Compile and validate
    const validate = ajv.compile(schema);
    const valid = validate(challenge);

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        const path = error.instancePath || "(root)";
        const message = error.message || "Unknown validation error";
        errors.push(`${path}: ${message}`);
      }
    }
  } catch (error) {
    errors.push(`Schema validation error: ${error.message}`);
  }

  return errors;
}

/**
 * Clears the cached schema (useful for testing)
 */
function clearSchemaCache() {
  cachedSchema = null;
}

module.exports = {
  validateChallenge,
  validateThemeExists,
  fetchRemoteSchema,
  clearSchemaCache,
  SCHEMA_URL
};
