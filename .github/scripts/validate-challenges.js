#!/usr/bin/env node

/**
 * Validation script for challenge files
 * Used by GitHub Actions to validate challenges in PRs
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { validateChallenge } = require("./validation");

const input = process.argv[2];
if (!input) {
  console.log("No challenge files to validate");
  process.exit(0);
}

// Parse input - can be a single challenge or a JSON array or space-separated string
let challenges = [];
try {
  // Try to parse as JSON array first
  challenges = JSON.parse(input);
} catch {
  // If not JSON, treat as space-separated string or single challenge
  challenges = input.split(' ').filter(c => c.trim().length > 0);
}

// Filter out empty strings
challenges = challenges.filter(c => c && c.trim().length > 0);

if (challenges.length === 0) {
  console.log("No valid challenges to validate");
  process.exit(0);
}

// Function to validate a single challenge
function validateSingleChallenge(challengeFolder) {
  console.log(`\n🔍 Validating challenge: ${challengeFolder}`);
  
  const rootPath = path.resolve(__dirname, '../../');
  const challengePath = path.join(rootPath, challengeFolder, "challenge.yaml");
  
  // Check if challenge.yaml exists
  if (!fs.existsSync(challengePath)) {
    console.error(`❌ File not found: ${challengePath}`);
    return false;
  }
  
  try {
    // Read and parse YAML
    const raw = fs.readFileSync(challengePath, "utf8");
    let challengeData;
    
    try {
      challengeData = yaml.load(raw);
    } catch (yamlError) {
      console.error(`❌ Invalid YAML format in ${challengePath}:`);
      console.error(`   ${yamlError.message}`);
      return false;
    }
    
    // Validate challenge data structure
    const validationErrors = validateChallenge(challengeData);
    if (validationErrors.length > 0) {
      console.error(`❌ Validation errors in ${challengePath}:`);
      validationErrors.forEach(error => {
        console.error(`   • ${error}`);
      });
      return false;
    }
    
    // Additional checks
    const warnings = [];
    
    // Check for recommended fields
    if (!challengeData.initial_situation || challengeData.initial_situation.trim().length < 10) {
      warnings.push("Consider adding a more detailed initial_situation");
    }
    
    if (!challengeData.objective || challengeData.objective.trim().length < 10) {
      warnings.push("Consider adding a more detailed objective");
    }
    
    // Check estimated time is reasonable
    if (challengeData.estimated_time < 5 || challengeData.estimated_time > 120) {
      warnings.push(`Estimated time (${challengeData.estimated_time}min) seems unusual. Consider reviewing.`);
    }
    
    // Check if manifests directory exists
    const manifestsPath = path.join(rootPath, challengeFolder, "manifests");
    if (!fs.existsSync(manifestsPath)) {
      warnings.push("No manifests/ directory found. Consider adding Kubernetes manifests.");
    } else {
      // Check if manifests directory has files
      const manifestFiles = fs.readdirSync(manifestsPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      if (manifestFiles.length === 0) {
        warnings.push("No YAML files found in manifests/ directory.");
      }
    }
    
    // Display warnings
    if (warnings.length > 0) {
      console.log(`⚠️  Warnings for ${challengeFolder}:`);
      warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }
    
    console.log(`✅ Challenge ${challengeFolder} is valid`);
    console.log(`   Title: "${challengeData.title}"`);
    console.log(`   Theme: ${challengeData.theme}`);
    console.log(`   Difficulty: ${challengeData.difficulty}`);
    console.log(`   Estimated time: ${challengeData.estimated_time} minutes`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error validating ${challengePath}:`);
    console.error(`   ${error.message}`);
    return false;
  }
}

// Main validation function
async function validateChallenges() {
  try {
    console.log(`🧪 Starting validation for ${challenges.length} challenge(s)...`);
    
    let hasErrors = false;
    const results = {
      valid: [],
      invalid: []
    };
    
    for (const challenge of challenges) {
      const trimmedChallenge = challenge.trim();
      if (!trimmedChallenge) continue;
      
      const isValid = validateSingleChallenge(trimmedChallenge);
      if (isValid) {
        results.valid.push(trimmedChallenge);
      } else {
        results.invalid.push(trimmedChallenge);
        hasErrors = true;
      }
    }
    
    // Summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`   ✅ Valid challenges: ${results.valid.length}`);
    console.log(`   ❌ Invalid challenges: ${results.invalid.length}`);
    
    if (results.valid.length > 0) {
      console.log(`\n✅ Valid challenges:`);
      results.valid.forEach(challenge => {
        console.log(`   • ${challenge}`);
      });
    }
    
    if (results.invalid.length > 0) {
      console.log(`\n❌ Invalid challenges:`);
      results.invalid.forEach(challenge => {
        console.log(`   • ${challenge}`);
      });
      
      console.log(`\n💡 To fix validation errors:`);
      console.log(`   1. Check the challenge.yaml syntax`);
      console.log(`   2. Ensure all required fields are present`);
      console.log(`   3. Verify data types and constraints`);
      console.log(`   4. See .github/scripts/validation.js for full schema`);
    }
    
    if (hasErrors) {
      console.log(`\n❌ Validation failed. Please fix the errors above.`);
      process.exit(1);
    } else {
      console.log(`\n🎉 All challenges are valid!`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error(`❌ Validation script error: ${error.message}`);
    process.exit(1);
  }
}

// Run validation
validateChallenges();
