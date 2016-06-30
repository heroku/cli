'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * addon (app, db) {
  const {resolve} = require('heroku-cli-addons')

  let attachment = yield resolve.attachment(cli.heroku, app, db)
  return attachment.addon
}

function * all (app) {
  const uniqby = require('lodash.uniqby')

  let attachments = yield cli.heroku.get(`/apps/${app}/addon-attachments`, {
    headers: {'Accept-Inclusion': 'addon:plan'}
  })
  let addons = attachments.map(a => a.addon)
  addons = addons.filter(a => a.plan.name.startsWith('heroku-postgresql'))
  addons = uniqby(addons, 'id')

  return addons
}

module.exports = {
  addon: co.wrap(addon),
  all: co.wrap(all)
}
