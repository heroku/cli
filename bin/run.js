const path = require('path')
const CLI = require('cli-engine').default
const cli = new CLI({
  root: path.join(__dirname, '..'),
  updateDisabled: `Update CLI with \`npm update -g heroku-cli\``,
  argv: process.argv.slice(1)
})
cli.run()
