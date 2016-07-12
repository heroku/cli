'use strict'

const co = require('co')

function * addon (heroku, app, db) {
  const {resolve} = require('heroku-cli-addons')

  let attachment = yield resolve.attachment(heroku, app, db, {'Accept-Inclusion': 'addon:plan'})
  return attachment.addon
}

function * all (heroku, app) {
  const uniqby = require('lodash.uniqby')

  let attachments = yield heroku.get(`/apps/${app}/addon-attachments`, {
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
