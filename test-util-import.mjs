// Test if we can import color from the main entry point
import {color} from '@heroku/heroku-cli-util'

console.log('✅ Import from main entry point works!')
console.log('Available color functions:', Object.keys(color).slice(0, 10).join(', '), '...')
console.log('Test color.app():', color.app('test-app'))
console.log('Test color.success():', color.success('Success!'))
