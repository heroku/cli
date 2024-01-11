'use strict'

const cli = require('heroku-cli-util')

module.exports = {
  topic: 'redis',
  command: 'promote',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: false}],
  description: 'sets DATABASE as your REDIS_URL',
  run: cli.command(async (context, heroku) => {
    const api = require('../lib/shared')(context, heroku)
    let addonsList = heroku.get(`/apps/${context.app}/addons`)

    let addon = await api.getRedisAddon(addonsList)

    let redisFilter = api.makeAddonsFilter('REDIS_URL')
    let redis = redisFilter(await addonsList)
    // Check if REDIS_URL is the last attachment--if so, we need
    // to replace it before we promote, because that implicitly
    // detaches whatever is currently at REDIS_URL, and if it is
    // the last attachment, the API will refuse. Note that we
    // filter for _URL config vars to ensure we correctly handle
    // private Redis plans which may have bastion config vars.
    // (the right way to do this is check attachments for the
    // current REDIS_URL but that's a bigger refactor).
    if (redis.length === 1 && redis[0].config_vars.filter(c => c.endsWith('_URL')).length === 1) {
      let attachment = redis[0]
      await heroku.post('/addon-attachments', {body: {
        app: {name: context.app},
        addon: {name: attachment.name},
        confirm: context.app,
      }})
    }

    cli.log(`Promoting ${addon.name} to REDIS_URL on ${context.app}`)
    await heroku.post('/addon-attachments', {body: {
      app: {name: context.app},
      addon: {name: addon.name},
      confirm: context.app,
      name: 'REDIS',
    }})
  }),
}
