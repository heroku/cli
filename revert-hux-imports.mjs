#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Find all TypeScript files
const files = globSync('src/**/*.ts', { ignore: 'node_modules/**' });

let updatedCount = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  const originalContent = content;

  // Replace: import * as hux from '@heroku/heroku-cli-util/hux'
  // With:    import {hux} from '@heroku/heroku-cli-util'
  content = content.replace(
    /import \* as hux from ['"]@heroku\/heroku-cli-util\/hux['"]/g,
    "import {hux} from '@heroku/heroku-cli-util'"
  );

  if (content !== originalContent) {
    writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`✓ Updated ${file}`);
  }
});

console.log(`\n✅ Updated ${updatedCount} files`);
