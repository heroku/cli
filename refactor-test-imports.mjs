import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.join(__dirname, 'test');

// Granular import mappings
const IMPORT_MAP = {
  color: '@heroku/heroku-cli-util/color',
  hux: '@heroku/heroku-cli-util/hux',
  utils: '@heroku/heroku-cli-util/utils',
};

// Pattern to match function calls that need to be updated from utils.pg.X to utils.X
const UTILS_PG_PATTERNS = [
  { pattern: /utils\.pg\.isEssentialDatabase\(/g, replacement: 'utils.isEssentialDatabase(' },
  { pattern: /utils\.pg\.isLegacyEssentialDatabase\(/g, replacement: 'utils.isLegacyEssentialDatabase(' },
  { pattern: /utils\.pg\.isAdvancedDatabase\(/g, replacement: 'utils.isAdvancedDatabase(' },
  { pattern: /utils\.pg\.isAdvancedPrivateDatabase\(/g, replacement: 'utils.isAdvancedPrivateDatabase(' },
  { pattern: /utils\.pg\.isLegacyDatabase\(/g, replacement: 'utils.isLegacyDatabase(' },
  { pattern: /utils\.pg\.isPostgresAddon\(/g, replacement: 'utils.isPostgresAddon(' },
  { pattern: /utils\.pg\.getAddonService\(/g, replacement: 'utils.getAddonService(' },
  { pattern: /utils\.pg\.DatabaseResolver/g, replacement: 'utils.DatabaseResolver' },
  { pattern: /utils\.pg\.PsqlService/g, replacement: 'utils.PsqlService' },
  { pattern: /utils\.pg\.host\(/g, replacement: 'utils.getHost(' },
  { pattern: /utils\.pg\.psql\.getPsqlConfigs\(/g, replacement: 'utils.getPsqlConfigs(' },
  { pattern: /utils\.pg\.psql\.sshTunnel\(/g, replacement: 'utils.sshTunnel(' },
  { pattern: /utils\.pg\.getConfigVarNameFromAttachment\(/g, replacement: 'utils.getConfigVarNameFromAttachment(' },
  { pattern: /utils\.pg\.addonService\(/g, replacement: 'utils.getAddonService(' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Check if file imports from heroku-cli-util
  if (!content.includes("'@heroku/heroku-cli-util'")) {
    return false;
  }

  // Find the import statement(s) for heroku-cli-util
  const importRegex = /import\s+({[^}]+})\s+from\s+'@heroku\/heroku-cli-util'/g;
  const typeImportRegex = /import\s+type\s+{([^}]+)}\s+from\s+'@heroku\/heroku-cli-util'/g;

  let hasChanges = false;

  // Extract what's being imported
  const importMatches = [...content.matchAll(importRegex)];
  const typeImportMatches = [...content.matchAll(typeImportRegex)];

  if (importMatches.length === 0 && typeImportMatches.length === 0) {
    return false;
  }

  // Parse regular imports
  const importsNeeded = new Set();
  const typeImportsNeeded = new Set();

  for (const match of importMatches) {
    const importContent = match[1];
    if (importContent.startsWith('{')) {
      // Named imports
      const names = importContent.slice(1, -1).split(',').map(s => s.trim());
      for (const name of names) {
        // Skip 'pg' as it should be a type import only
        if (name !== 'pg') {
          importsNeeded.add(name);
        } else {
          typeImportsNeeded.add('pg');
        }
      }
    }
  }

  // Parse type imports
  for (const match of typeImportMatches) {
    const names = match[1].split(',').map(s => s.trim());
    for (const name of names) {
      typeImportsNeeded.add(name);
    }
  }

  // Check if we have anything to migrate
  const hasMigratableImports = Array.from(importsNeeded).some(name => IMPORT_MAP[name]);

  if (hasMigratableImports || typeImportsNeeded.size > 0) {
    // Remove old import statements
    content = content.replace(importRegex, '');
    content = content.replace(typeImportRegex, '');

    // Build new import statements
    const newImports = [];

    for (const name of importsNeeded) {
      if (IMPORT_MAP[name]) {
        newImports.push(`import * as ${name} from '${IMPORT_MAP[name]}'`);
        hasChanges = true;
      }
    }

    // Add type imports for pg if needed
    if (typeImportsNeeded.size > 0) {
      const typeNames = Array.from(typeImportsNeeded).join(', ');
      newImports.push(`import type {${typeNames}} from '@heroku/heroku-cli-util'`);
      hasChanges = true;
    }

    if (hasChanges) {
      // Find where to insert the new imports (after other imports)
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find the last import line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' && insertIndex > 0) {
          // Stop at first blank line after imports
          break;
        }
      }

      // Insert new imports
      lines.splice(insertIndex, 0, ...newImports);
      content = lines.join('\n');

      // Clean up multiple blank lines in import section
      content = content.replace(/\n\n\n+/g, '\n\n');

      // Update function calls to remove utils.pg. prefix
      for (const { pattern, replacement } of UTILS_PG_PATTERNS) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement);
          hasChanges = true;
        }
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
      }
    }
  }

  return false;
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  let modifiedCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      modifiedCount += traverseDirectory(filePath);
    } else if (file.endsWith('.test.ts')) {
      if (processFile(filePath)) {
        modifiedCount++;
        console.log(`Modified: ${filePath}`);
      }
    }
  }

  return modifiedCount;
}

console.log('Starting migration of test imports...');
const count = traverseDirectory(testDir);
console.log(`\nMigration complete. Modified ${count} test files.`);
