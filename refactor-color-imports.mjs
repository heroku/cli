#!/usr/bin/env node

/**
 * Script to refactor color-only imports from @heroku/heroku-cli-util
 * Changes: import {color} from '@heroku/heroku-cli-util'
 * To:      import * as color from '@heroku/heroku-cli-util/dist/ux/colors.js'
 */

import { readFile, writeFile } from 'fs/promises'
import { execSync } from 'child_process'

const OLD_IMPORT = "import {color} from '@heroku/heroku-cli-util'"
const NEW_IMPORT = "import * as color from '@heroku/heroku-cli-util/dist/ux/colors.js'"

async function getFilesToRefactor() {
  const output = execSync(
    `grep -rl "^import {color} from '@heroku/heroku-cli-util'$" src/`,
    { encoding: 'utf-8' }
  )
  return output.trim().split('\n').filter(Boolean)
}

async function refactorFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')

    // Find and replace the import line
    let modified = false
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === OLD_IMPORT) {
        lines[i] = NEW_IMPORT
        modified = true
        break
      }
    }

    if (modified) {
      await writeFile(filePath, lines.join('\n'), 'utf-8')
      return true
    }
    return false
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Refactoring color imports...\n')

  const files = await getFilesToRefactor()
  console.log(`Found ${files.length} files to refactor\n`)

  let successCount = 0
  let failCount = 0

  for (const file of files) {
    const success = await refactorFile(file)
    if (success) {
      successCount++
      process.stdout.write('.')
    } else {
      failCount++
      process.stdout.write('x')
    }

    // Add newline every 50 files for readability
    if ((successCount + failCount) % 50 === 0) {
      process.stdout.write('\n')
    }
  }

  console.log('\n')
  console.log('─'.repeat(60))
  console.log(`✅ Successfully refactored: ${successCount} files`)
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} files`)
  }
  console.log('─'.repeat(60))
}

main().catch(console.error)
