#!/usr/bin/env node

/**
 * Refactors utils and pg imports to use granular module paths
 * Handles all combinations of color, hux, utils, and pg imports
 */

import { promises as fs } from 'fs'
import { glob } from 'glob'

const IMPORT_MAP = {
  color: '@heroku/heroku-cli-util/color',
  hux: '@heroku/heroku-cli-util/hux',
  utils: '@heroku/heroku-cli-util/utils',
  pg: '@heroku/heroku-cli-util/utils/pg',
}

async function refactorFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')
  let modified = false
  let newContent = content

  // Pattern: import {various, combinations} from '@heroku/heroku-cli-util'
  // Handle single-line imports
  const singleLineRegex = /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+'@heroku\/heroku-cli-util'$/gm

  newContent = newContent.replace(singleLineRegex, (match, typeKeyword, importsList) => {
    const isTypeImport = !!typeKeyword

    // Parse imports
    const imports = importsList
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // Check if this has utils or pg (which we want to migrate)
    const hasUtils = imports.includes('utils')
    const hasPg = imports.includes('pg')

    if (!hasUtils && !hasPg) {
      // No utils/pg, leave it alone (already handled by color/hux migrations)
      return match
    }

    // Convert each import to granular
    const granularImports = imports.map(importName => {
      const path = IMPORT_MAP[importName]
      if (!path) {
        console.warn(`Warning: Unknown import "${importName}" in ${filePath}`)
        return null
      }

      if (isTypeImport) {
        return `import type * as ${importName} from '${path}'`
      } else {
        return `import * as ${importName} from '${path}'`
      }
    }).filter(Boolean)

    if (granularImports.length > 0) {
      modified = true
      return granularImports.join('\n')
    }

    return match
  })

  // Handle multi-line imports
  const multilineRegex = /^import\s+(type\s+)?\{([^}]*(?:\n[^}]*)*)\}\s+from\s+'@heroku\/heroku-cli-util'$/gm

  newContent = newContent.replace(multilineRegex, (match, typeKeyword, importsList) => {
    const isTypeImport = !!typeKeyword

    // Parse imports
    const imports = importsList
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(Boolean)

    // Check if this has utils or pg
    const hasUtils = imports.includes('utils')
    const hasPg = imports.includes('pg')

    if (!hasUtils && !hasPg) {
      return match
    }

    // Convert each import to granular
    const granularImports = imports.map(importName => {
      const path = IMPORT_MAP[importName]
      if (!path) {
        console.warn(`Warning: Unknown import "${importName}" in ${filePath}`)
        return null
      }

      if (isTypeImport) {
        return `import type * as ${importName} from '${path}'`
      } else {
        return `import * as ${importName} from '${path}'`
      }
    }).filter(Boolean)

    if (granularImports.length > 0) {
      modified = true
      return granularImports.join('\n')
    }

    return match
  })

  if (modified) {
    await fs.writeFile(filePath, newContent, 'utf-8')
    return true
  }

  return false
}

async function main() {
  console.log('🔍 Finding TypeScript files with utils/pg imports...\n')

  const files = await glob('src/**/*.ts', {
    ignore: ['**/node_modules/**', '**/dist/**']
  })

  console.log(`📝 Refactoring utils/pg imports...\n`)

  let modifiedCount = 0

  for (const file of files) {
    const wasModified = await refactorFile(file)
    if (wasModified) {
      modifiedCount++
      console.log(`  ✓ ${file}`)
    }
  }

  console.log(`\n✅ Refactored ${modifiedCount} file(s)`)

  if (modifiedCount > 0) {
    console.log('\n💡 Next steps:')
    console.log('  1. Run: npm run build')
    console.log('  2. Test commands to verify functionality')
  }
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
