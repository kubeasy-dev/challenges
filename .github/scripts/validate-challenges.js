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

/**
 * Validates ArgoCD sync-wave annotations on manifest and policy files
 * Rules:
 *   - manifests/namespace.yaml → sync-wave: "0"
 *   - manifests/*.yaml (others) → sync-wave: "1"
 *   - policies/*.yaml → sync-wave: "2"
 */
function validateSyncWaveAnnotations(rootPath, challengeFolder) {
  const errors = [];

  const getSyncWave = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const docs = yaml.loadAll(content);

      for (const doc of docs) {
        if (doc && doc.metadata) {
          const annotations = doc.metadata.annotations || {};
          return annotations['argocd.argoproj.io/sync-wave'];
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  // Check manifests folder
  const manifestsPath = path.join(rootPath, challengeFolder, 'manifests');
  if (fs.existsSync(manifestsPath)) {
    const manifestFiles = fs.readdirSync(manifestsPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of manifestFiles) {
      const filePath = path.join(manifestsPath, file);
      const syncWave = getSyncWave(filePath);
      const isNamespace = file === 'namespace.yaml' || file === 'namespace.yml';
      const expectedWave = isNamespace ? '0' : '1';

      if (syncWave !== expectedWave) {
        errors.push(`manifests/${file}: expected sync-wave "${expectedWave}", got "${syncWave || 'none'}"`);
      }
    }
  }

  // Check policies folder
  const policiesPath = path.join(rootPath, challengeFolder, 'policies');
  if (fs.existsSync(policiesPath)) {
    const policyFiles = fs.readdirSync(policiesPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of policyFiles) {
      const filePath = path.join(policiesPath, file);
      const syncWave = getSyncWave(filePath);

      if (syncWave !== '2') {
        errors.push(`policies/${file}: expected sync-wave "2", got "${syncWave || 'none'}"`);
      }
    }
  }

  return errors;
}

// Function to validate a single challenge
async function validateSingleChallenge(challengeFolder) {
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
    const validationErrors = await validateChallenge(challengeData);
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
    if (!challengeData.initialSituation || challengeData.initialSituation.trim().length < 10) {
      warnings.push("Consider adding a more detailed initialSituation");
    }
    
    if (!challengeData.objective || challengeData.objective.trim().length < 10) {
      warnings.push("Consider adding a more detailed objective");
    }
    
    // Check estimated time is reasonable
    if (challengeData.estimatedTime < 5 || challengeData.estimatedTime > 120) {
      warnings.push(`Estimated time (${challengeData.estimatedTime}min) seems unusual. Consider reviewing.`);
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

    // Validate ArgoCD sync-wave annotations
    const syncWaveErrors = validateSyncWaveAnnotations(rootPath, challengeFolder);
    if (syncWaveErrors.length > 0) {
      console.error(`❌ Sync-wave annotation errors in ${challengeFolder}:`);
      syncWaveErrors.forEach(error => {
        console.error(`   • ${error}`);
      });
      return false;
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
    console.log(`   Type: ${challengeData.type}`);
    console.log(`   Theme: ${challengeData.theme}`);
    console.log(`   Difficulty: ${challengeData.difficulty}`);
    console.log(`   Estimated time: ${challengeData.estimatedTime} minutes`);
    
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
      
      const isValid = await validateSingleChallenge(trimmedChallenge);
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
