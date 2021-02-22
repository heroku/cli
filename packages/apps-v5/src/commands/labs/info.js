'use strict'

let cli = require('heroku-cli-util')

function print (feature) {
  cli.styledHeader(feature.name)
  cli.styledObject({
    Description: feature.description,
    Enabled: feature.enabled ? cli.color.green(feature.enabled) : cli.color.red(feature.enabled),
    Docs: feature.doc_url
  })
}

async function run(context, heroku) {
  let feature
  try {
    feature = await heroku.get(`/account/features/${context.args.feature}`)
  } catch (err) {
    if (err.statusCode !== 404) throw err
    // might be an app feature
    if (!context.app) throw err
    feature = await heroku.get(`/apps/${context.app}/features/${context.args.feature}`)
  }
  if (context.flags.json) {
    cli.styledJSON(feature)
  } else {
    print(feature)
  }
}

module.exports = {
  topic: 'labs',
  command: 'info',
  description: 'show feature info',
  args: [{ name: 'feature' }],
  flags: [
    { name: 'json', description: 'display as json' }
  ],
  needsAuth: true,
  wantsApp: true,
  run: cli.command(run)
}
