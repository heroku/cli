#!/usr/bin/env node

// Test the new clean import path
console.log('Testing new import path...\n')

try {
  const color = await import('@heroku/heroku-cli-util/color')
  console.log('✅ Import from "@heroku/heroku-cli-util/color" works!')
  console.log('\nAvailable functions:', Object.keys(color).filter(k => typeof color[k] === 'function').slice(0, 10).join(', '), '...')
  console.log('\nTest color.app():', color.app('test-app'))
  console.log('Test color.success():', color.success('Success!'))
  console.log('Test color.warning():', color.warning('Warning!'))
} catch (error) {
  console.error('❌ Import failed:', error.message)
  process.exit(1)
}
