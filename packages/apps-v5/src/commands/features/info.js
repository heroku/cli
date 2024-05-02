'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let feature = await heroku.get(`/apps/${context.app}/features/${context.args.feature}`)

  if (context.flags.json) {
    cli.styledJSON(feature)
  } else {
    cli.styledHeader(feature.name)
    cli.styledObject({
      Description: feature.description,
      Enabled: feature.enabled ? cli.color.green(feature.enabled) : cli.color.red(feature.enabled),
      Docs: feature.doc_url,
    })
  }
}

module.exports = {
  topic: 'features',
  command: 'info',
  description: 'display information about a feature',
  args: [{name: 'feature'}],
  flags: [{name: 'json', description: 'output in json format'}],
  needsAuth: true,
  needsApp: true,
  run: cli.command(run),
}
