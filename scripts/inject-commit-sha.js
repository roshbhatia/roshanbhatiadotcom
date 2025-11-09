#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current commit SHA
try {
  const commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  
  // Create or update the version file
  const versionFilePath = path.join(__dirname, '../src/version.ts');
  const versionContent = `// Auto-generated at build time
export const COMMIT_SHA = '${commitSha}';
export const BUILD_TIME = new Date().toISOString();
`;

  fs.writeFileSync(versionFilePath, versionContent);
  console.log(`Injected commit SHA: ${commitSha}`);
} catch (error) {
  console.error('Failed to get commit SHA:', error.message);
  process.exit(1);
}