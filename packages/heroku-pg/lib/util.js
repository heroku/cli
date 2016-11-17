'use strict'

const cli = require('heroku-cli-util')
const debug = require('./debug')
const url = require('url')
const sample = require('lodash.sample')

const getBastion = function (config, baseName) {
  // If there are bastions, extract a host and a key
  // otherwise, return an empty Object

  // If there are bastions:
  // * there should be one *_BASTION_KEY
  // * pick one host from the comma-separated list in *_BASTIONS
  // We assert that _BASTIONS and _BASTION_KEY always exist together
  // If either is falsy, pretend neither exist

  const bastionKey = config[`${baseName}_BASTION_KEY`]
  const bastionHost = sample((config[`${baseName}_BASTIONS`] || '').split(','))
  return (!(bastionKey && bastionHost))
    ? {}
    : {bastionHost, bastionKey}
}

exports.getConnectionDetails = function (addon, config) {
  const connstringVars = addon.config_vars
    .filter((cv) => (
      config[cv].startsWith('postgres://') &&
      cv.endsWith('_URL')
    ))

  if (connstringVars.length === 0) {
    throw new Error('Database URL not found for this addon')
  }

  // remove _URL from the end of the config var name
  const baseName = connstringVars[0].slice(0, -4)

  // build the default payload for non-bastion dbs
  debug(`Using "${connstringVars[0]}" to connect to your database…`)
  const target = url.parse(config[connstringVars[0]])
  let [user, password] = target.auth.split(':')

  let payload = {
    user,
    password,
    database: target.path.split('/', 2)[1],
    host: target.hostname,
    port: target.port,
    addon
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
