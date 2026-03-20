#!/usr/bin/env node

/**
 * Refactors heroku-cli-util color imports to use the new clean export path
 *
 * Changes:
 * FROM: import * as color from '@heroku/heroku-cli-util/dist/ux/colors.js'
 * TO:   import * as color from '@heroku/heroku-cli-util/color'
 */

import { promises as fs } from 'fs'
import { glob } from 'glob'

const OLD_IMPORT = `import * as color from '@heroku/heroku-cli-util/dist/ux/colors.js'`
const NEW_IMPORT = `import * as color from '@heroku/heroku-cli-util/color'`

async function refactorFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')

  if (!content.includes(OLD_IMPORT)) {
    return false
  }

  const newContent = content.replace(OLD_IMPORT, NEW_IMPORT)

  if (newContent !== content) {
    await fs.writeFile(filePath, newContent, 'utf-8')
    return true
  }

  return false
}

async function main() {
  console.log('🔍 Finding TypeScript files with old imports...\n')

  const files = await glob('src/**/*.ts', {
    ignore: ['**/node_modules/**', '**/dist/**']
  })

  console.log(`📝 Refactoring imports...\n`)

  let modifiedCount = 0
  const modifiedFiles = []

  for (const file of files) {
    const wasModified = await refactorFile(file)
    if (wasModified) {
      modifiedCount++
      modifiedFiles.push(file)
      console.log(`  ✓ ${file}`)
    }
  }

  console.log(`\n✅ Refactored ${modifiedCount} file(s)`)

  if (modifiedCount > 0) {
    console.log('\n💡 Next steps:')
    console.log('  1. Run: npm run build')
    console.log('  2. Test a command: heroku version')
    console.log('  3. Run timing tests to verify performance is still good')
  } else {
    console.log('\n⚠️  No files were modified. Make sure you have:')
    console.log('  1. Linked @heroku/heroku-cli-util with npm link')
    console.log('  2. Files with the old import pattern exist')
  }
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
