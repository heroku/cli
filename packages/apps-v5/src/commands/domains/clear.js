'use strict'

const cli = require('heroku-cli-util')

module.exports = {
  topic: 'domains',
  command: 'clear',
  description: 'remove all domains from an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(async (context, heroku) => {
    await cli.action(`Removing all domains from ${cli.color.app(context.app)}`, (async () => {
      let domains = await heroku.get(`/apps/${context.app}/domains`)
      domains = domains.filter((d) => d.kind === 'custom')
      for (const domain of domains) {
        await heroku.delete(`/apps/${context.app}/domains/${domain.hostname}`)
      }
    })())
  })
}
