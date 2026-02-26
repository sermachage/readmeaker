const fs = require('fs');
const path = require('path');

// Define the paths you want to scan for your project structure
const projectDir = path.join(__dirname);

// Directories and files to exclude from the project structure
const IGNORED = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  '.pnpm-store', '.turbo'
]);

// Markers used to delimit the auto-generated section in the README
const START_MARKER = '<!-- AUTO-GENERATED-STRUCTURE:START -->';
const END_MARKER = '<!-- AUTO-GENERATED-STRUCTURE:END -->';

// Helper function to get a list of files and directories
function getProjectStructure(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let structure = '';

  entries.forEach(entry => {
    if (IGNORED.has(entry.name)) return;
    if (entry.isDirectory()) {
      structure += `${prefix}- ${entry.name}/\n`;
      structure += getProjectStructure(path.join(dir, entry.name), prefix + '  ');
    } else {
      structure += `${prefix}- ${entry.name}\n`;
    }
  });

  return structure;
}

// Update (or append) the auto-generated structure section in the README
function updateReadme() {
  const structure = getProjectStructure(projectDir);

  const generatedBlock = `${START_MARKER}
## Auto-Generated Project Structure

\`\`\`
${structure}
\`\`\`
${END_MARKER}`;

  const readmePath = path.join(__dirname, 'README.md');
  let existingContent = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, 'utf8')
    : '';

  // Replace existing auto-generated section, or append if not present
  const startIdx = existingContent.indexOf(START_MARKER);
  const endIdx = existingContent.indexOf(END_MARKER);

  let updatedReadme;
  if (startIdx !== -1 && endIdx !== -1) {
    updatedReadme =
      existingContent.slice(0, startIdx) +
      generatedBlock +
      existingContent.slice(endIdx + END_MARKER.length);
  } else {
    updatedReadme = existingContent.trimEnd() + '\n\n' + generatedBlock + '\n';
  }

  fs.writeFileSync(readmePath, updatedReadme, 'utf8');
  console.log('README.md updated successfully!');
}

updateReadme();
