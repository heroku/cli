const fs = require('fs-extra')
const path = require('path')
const flatten = require('lodash.flatten')

exports.topics = [
  { name: 'apps', description: 'manage apps' },
  { name: 'auth', description: 'heroku authentication' },
  { name: 'buildpacks', description: 'manage the buildpacks for an app' },
  { name: 'config', description: 'manage app config vars' },
  { name: 'domains', description: 'manage the domains for an app' },
  { name: 'drains', description: 'list all log drains' },
  { name: 'dyno', hidden: true },
  { name: 'features', description: 'manage optional features' },
  { name: 'keys', description: 'manage ssh keys' },
  { name: 'labs', description: 'experimental features' },
  { name: 'maintenance', description: 'manage maintenance mode for an app' },
  { name: 'notifications', description: 'display notifications' },
  { name: 'ps', description: 'manage dynos (dynos, workers)' },
  { name: 'releases', description: 'manage app releases' }
]

function getCommands (dir) {
  function requireCommand (f) {
    let c = require(f)
    return c.default ? c.default : c
  }

  let all = fs.readdirSync(dir).map(f => path.join(dir, f))
  let commands = all
    .filter(f => path.extname(f) === '.js' && !f.endsWith('.test.js'))
    .map(requireCommand)
  let subs = all
    .filter(f => fs.lstatSync(f).isDirectory())
    .map(getCommands)
  return flatten(commands.concat(flatten(subs)))
}

exports.commands = getCommands(path.join(__dirname, 'commands'))
