#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Find all TypeScript files
const files = globSync('{src,test}/**/*.ts', { ignore: 'node_modules/**' });

let updatedCount = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  const originalContent = content;
  let hasChanges = false;

  // Check if file imports utils from heroku-cli-util
  if (!content.match(/import.*utils.*from ['"]@heroku\/heroku-cli-util['"]/)) {
    return; // Skip files that don't import utils
  }

  // Pattern 1: import {color, utils} from '@heroku/heroku-cli-util'
  // Pattern 2: import {utils, color} from '@heroku/heroku-cli-util'
  // Pattern 3: import {utils} from '@heroku/heroku-cli-util'
  // Pattern 4: import {color, hux, pg, utils} from '@heroku/heroku-cli-util'
  // etc.

  const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@heroku\/heroku-cli-util['"]/);

  if (importMatch) {
    const importList = importMatch[1].split(',').map(s => s.trim());

    if (importList.includes('utils')) {
      // Remove utils from the import list, and also remove 'pg' if present (to avoid conflict)
      const newImportList = importList.filter(item => item !== 'utils' && item !== 'pg');

      // Build new import statements
      let newImports = [];

      if (newImportList.length > 0) {
        newImports.push(`import {${newImportList.join(', ')}} from '@heroku/heroku-cli-util'`);
      }

      // Add the pg utils import (this will replace the old 'pg' type import)
      newImports.push(`import * as pg from '@heroku/heroku-cli-util/utils/pg'`);

      // Replace the old import
      content = content.replace(
        /import\s+\{[^}]+\}\s+from\s+['"]@heroku\/heroku-cli-util['"]/,
        newImports.join('\n')
      );

      hasChanges = true;
    }
  }

  // Now replace utils.pg usage with pg
  if (hasChanges) {
    // Replace utils.pg.DatabaseResolver with pg.DatabaseResolver
    content = content.replace(/utils\.pg\.DatabaseResolver/g, 'pg.DatabaseResolver');

    // Replace utils.pg.host() with pg.getHost()
    content = content.replace(/utils\.pg\.host\(\)/g, 'pg.getHost()');

    // Replace utils.pg.PsqlService with pg.PsqlService
    content = content.replace(/utils\.pg\.PsqlService/g, 'pg.PsqlService');

    // Replace utils.pg.isLegacyEssentialDatabase with pg.isLegacyEssentialDatabase
    content = content.replace(/utils\.pg\.isLegacyEssentialDatabase/g, 'pg.isLegacyEssentialDatabase');

    // Replace utils.pg.isAdvancedDatabase with pg.isAdvancedDatabase
    content = content.replace(/utils\.pg\.isAdvancedDatabase/g, 'pg.isAdvancedDatabase');

    // Replace utils.pg.isAdvancedPrivateDatabase with pg.isAdvancedPrivateDatabase
    content = content.replace(/utils\.pg\.isAdvancedPrivateDatabase/g, 'pg.isAdvancedPrivateDatabase');

    // Replace utils.pg.addonService() with pg.addonService()
    content = content.replace(/utils\.pg\.addonService\(\)/g, 'pg.addonService()');

    // Replace utils.pg.psql.getConfigVarNameFromAttachment with pg.getConfigVarNameFromAttachment
    content = content.replace(/utils\.pg\.psql\.getConfigVarNameFromAttachment/g, 'pg.getConfigVarNameFromAttachment');

    // Replace any other utils.pg. patterns (catch-all)
    content = content.replace(/utils\.pg\./g, 'pg.');
  }

  if (content !== originalContent) {
    writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`✓ Updated ${file}`);
  }
});

console.log(`\n✅ Updated ${updatedCount} files`);
