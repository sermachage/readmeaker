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
  try {
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

    const startIdx = existingContent.indexOf(START_MARKER);
    // Use lastIndexOf for END_MARKER to handle any accidental duplicates
    const endIdx = existingContent.lastIndexOf(END_MARKER);

    const hasStart = startIdx !== -1;
    const hasEnd = endIdx !== -1;

    let updatedReadme;
    if (hasStart && hasEnd && startIdx < endIdx) {
      // Normal case: both markers present and in the correct order
      updatedReadme =
        existingContent.slice(0, startIdx) +
        generatedBlock +
        existingContent.slice(endIdx + END_MARKER.length);
    } else if (!hasStart && !hasEnd) {
      // No markers present: append a new auto-generated block
      updatedReadme = existingContent.trimEnd() + '\n\n' + generatedBlock + '\n';
    } else {
      // Orphaned or misordered marker(s) detected: clean up and regenerate
      console.warn(
        'Warning: Detected orphaned or misordered auto-generated markers in README.md. ' +
        'Cleaning them up and regenerating the auto-generated section.'
      );
      let cleanedContent = existingContent
        .split(START_MARKER).join('')
        .split(END_MARKER).join('');
      cleanedContent = cleanedContent.trimEnd();
      updatedReadme = cleanedContent + '\n\n' + generatedBlock + '\n';
    }

    fs.writeFileSync(readmePath, updatedReadme, 'utf8');
    console.log('README.md updated successfully!');
  } catch (err) {
    console.error('Error updating README.md:', err.message);
    process.exit(1);
  }
}

updateReadme();
