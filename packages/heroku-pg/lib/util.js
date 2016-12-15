'use strict'

const cli = require('heroku-cli-util')
const debug = require('./debug')
const getBastion = require('./bastion').getBastion

function getUrl (configVars) {
  let connstringVars = configVars.filter((cv) => (cv.endsWith('_URL')))
  if (connstringVars.length === 0) throw new Error('Database URL not found for this addon')
  return connstringVars[0]
}

exports.getUrl = getUrl

exports.getConnectionDetails = function (attachment, config) {
  const url = require('url')
  const connstringVar = getUrl(attachment.config_vars.filter((cv) => config[cv].startsWith('postgres://')))

  // remove _URL from the end of the config var name
  const baseName = connstringVar.slice(0, -4)

  // build the default payload for non-bastion dbs
  debug(`Using "${connstringVar}" to connect to your database…`)
  const target = url.parse(config[connstringVar])
  let [user, password] = target.auth.split(':')

  let payload = {
    user,
    password,
    database: target.path.split('/', 2)[1],
    host: target.hostname,
    port: target.port,
    attachment,
    url: target
  }

  // If bastion creds exist, graft it into the payload
  const bastion = getBastion(config, baseName)
  if (bastion) {
    Object.assign(payload, bastion)
  }

  return payload
}

exports.starterPlan = a => !!a.plan.name.match(/(dev|basic)$/)

exports.configVarNamesFromValue = (config, value) => {
  const sortBy = require('lodash.sortby')

  let keys = []
  for (let key of Object.keys(config)) {
    if (config[key] === value) keys.push(key)
  }
  return sortBy(keys, k => k !== 'DATABASE_URL', 'name')
}

exports.databaseNameFromUrl = (uri, config) => {
  const url = require('url')

  let names = exports.configVarNamesFromValue(config, uri)
  let name = names.pop()
  while (names.length > 0 && name === 'DATABASE_URL') name = names.pop()
  if (name) return cli.color.configVar(name.replace(/_URL$/, ''))
  uri = url.parse(uri)
  return `${uri.hostname}:${uri.port || 5432}${uri.path}`
}
