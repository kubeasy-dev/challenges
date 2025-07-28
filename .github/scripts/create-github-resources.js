const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const input = process.argv[2];
if (!input) {
  console.log("No challenges to process");
  process.exit(0);
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

if (challenges.length === 0) {
  console.log("No valid challenges to process");
  process.exit(0);
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Missing GITHUB_TOKEN environment variable");
  process.exit(1);
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

// Function to read challenge data
function getChallengeData(challengeFolder) {
  const rootPath = path.resolve(__dirname, '../../');
  const challengePath = path.join(rootPath, challengeFolder, "challenge.yaml");
  
  if (!fs.existsSync(challengePath)) {
    console.warn(`Challenge file not found: ${challengePath}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(challengePath, "utf8");
    return yaml.load(raw);
  } catch (error) {
    console.warn(`Error reading challenge file ${challengePath}:`, error.message);
    return null;
  }
}

// Function to create GitHub label
async function createLabel(challengeFolder, challengeData) {
  const labelName = `challenge:${challengeFolder}`;
  const labelColor = '0366d6'; // Blue color
  
  try {
    await octokit.rest.issues.createLabel({
      owner,
      repo,
      name: labelName,
      color: labelColor,
      description: `Label for ${challengeData?.title || challengeFolder} challenge`
    });
    
    console.log(`✅ Created label: ${labelName}`);
    return true;
  } catch (error) {
    if (error.status === 422) {
      console.log(`ℹ️  Label ${labelName} already exists`);
      return true;
    } else {
      console.error(`❌ Error creating label ${labelName}:`, error.message);
      return false;
    }
  }
}

// Function to create GitHub discussion
async function createDiscussion(challengeFolder, challengeData) {
  if (!challengeData) {
    console.warn(`⚠️  Skipping discussion creation for ${challengeFolder} - no challenge data`);
    return false;
  }

  const title = `💬 ${challengeData.title} - Challenge Discussion`;
  const body = `# ${challengeData.title}

${challengeData.description}

## Challenge Details
- **Theme:** ${challengeData.theme}
- **Difficulty:** ${challengeData.difficulty}
- **Estimated Time:** ${challengeData.estimated_time} minutes

## Initial Situation
${challengeData.initial_situation || 'Not specified'}

## Objective
${challengeData.objective || 'Not specified'}

---

Use this discussion to:
- 🤔 Ask questions about the challenge
- 💡 Share hints and tips
- 🎉 Celebrate your success
- 🐛 Report issues or bugs
- 💬 Discuss different approaches

**Happy learning! 🚀**`;

  try {
    // Get repository ID first
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    // Get the repository's discussion categories using GraphQL
    const categoriesQuery = `
      query GetDiscussionCategories($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          discussionCategories(first: 10) {
            nodes {
              id
              name
            }
          }
        }
      }
    `;

    const categoriesResponse = await octokit.graphql(categoriesQuery, {
      owner,
      name: repo,
    });

    const categories = categoriesResponse.repository.discussionCategories.nodes;

    // Find the "challenges" category first, fallback to other categories
    let categoryId = categories.find(cat => 
      cat.name.toLowerCase() === 'challenges' ||
      cat.name.toLowerCase() === 'challenge discussions' ||
      cat.name.toLowerCase() === 'challenge discussion'
    )?.id;

    let selectedCategory = categories.find(cat => cat.id === categoryId);

    // If no challenges category found, try other common categories
    if (!categoryId) {
      const fallbackCategory = categories.find(cat => 
        cat.name.toLowerCase() === 'q&a' ||
        cat.name.toLowerCase() === 'general'
      );
      categoryId = fallbackCategory?.id;
      selectedCategory = fallbackCategory;
    }

    if (!categoryId && categories.length > 0) {
      categoryId = categories[0].id; // Use first available category
      selectedCategory = categories[0];
      console.warn(`⚠️  Using default category "${categories[0].name}" - consider creating a "Challenges" category`);
    }

    if (!categoryId) {
      console.error(`❌ No discussion categories found for repository ${owner}/${repo}`);
      console.error(`💡 Create a "Challenges" category in your repository's Discussions settings`);
      return false;
    }

    console.log(`💭 Using discussion category: "${selectedCategory?.name}"`);

    // Create the discussion using GraphQL API
    const mutation = `
      mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(input: {
          repositoryId: $repositoryId,
          categoryId: $categoryId,
          title: $title,
          body: $body
        }) {
          discussion {
            id
            url
          }
        }
      }
    `;

    const variables = {
      repositoryId: repoData.node_id,
      categoryId: categoryId,
      title: title,
      body: body
    };

    const response = await octokit.graphql(mutation, variables);
    
    console.log(`✅ Created discussion: ${response.createDiscussion.discussion.url}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating discussion for ${challengeFolder}:`, error.message);
    return false;
  }
}

(async () => {
  try {
    console.log(`🚀 Starting GitHub resources creation for ${challenges.length} challenge(s)...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const challenge of challenges) {
      const trimmedChallenge = challenge.trim();
      if (!trimmedChallenge) continue;
      
      console.log(`\n🔧 Processing challenge: ${trimmedChallenge}`);
      
      const challengeData = getChallengeData(trimmedChallenge);
      
      // Create label
      const labelSuccess = await createLabel(trimmedChallenge, challengeData);
      
      // Create discussion
      const discussionSuccess = await createDiscussion(trimmedChallenge, challengeData);
      
      if (labelSuccess && discussionSuccess) {
        console.log(`✅ Successfully processed ${trimmedChallenge}`);
        successCount++;
      } else {
        console.log(`⚠️  Partially processed ${trimmedChallenge}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Partial/Failed: ${errorCount}`);
    console.log(`\n🎉 Finished processing ${challenges.length} challenge(s)`);
    
    // Exit with error code if any failures
    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error processing challenges:", error.message);
    process.exit(1);
  }
})();
