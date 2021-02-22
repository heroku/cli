'use strict'

let cli = require('heroku-cli-util')

function formatKey (key) {
  key = key.trim().split(/\s/)
  return `${key[0]} ${key[1].substr(0, 10)}...${key[1].substr(-10, 10)} ${cli.color.green(key[2])}`
}

async function run(context, heroku) {
  let keys = await heroku.get('/account/keys')
  if (context.flags.json) {
    cli.styledJSON(keys)
  } else if (keys.length === 0) {
    cli.warn('You have no SSH keys.')
  } else {
    cli.styledHeader(`${cli.color.cyan(keys[0].email)} keys`)
    if (context.flags.long) {
      keys.forEach((k) => cli.log(k.public_key))
    } else {
      keys.map((k) => cli.log(formatKey(k.public_key)))
    }
  }
}

module.exports = {
  topic: 'keys',
  description: 'display your SSH keys',
  needsAuth: true,
  run: cli.command(run),
  flags: [
    { name: 'long', char: 'l', description: 'display full SSH keys' },
    { name: 'json', description: 'output in json format' }
  ]
}
