'use strict'

const cli = require('heroku-cli-util')
const debug = require('./debug')
const { sortBy } = require('lodash')
const printf = require('printf')
const URL = require('url').URL
const env = require('process').env

function getConfigVarName (configVars) {
  let connstringVars = configVars.filter((cv) => (cv.endsWith('_URL')))
  if (connstringVars.length === 0) throw new Error('Database URL not found for this addon')
  return connstringVars[0]
}

exports.getConfigVarName = getConfigVarName

function getConfigVarNameFromAttachment (attachment, config) {
  const configVars = attachment.config_vars.filter((cv) => {
    return config[cv] && config[cv].startsWith('postgres://')
  })
  if (configVars.length === 0) {
    throw new Error(`No config vars found for ${attachment.name}; perhaps they were removed as a side effect of ${cli.color.cmd('heroku rollback')}? Use ${cli.color.cmd('heroku addons:attach')} to create a new attachment and then ${cli.color.cmd('heroku addons:detach')} to remove the current attachment.`)
  }

  let configVarName = `${attachment.name}_URL`
  if (configVars.includes(configVarName) && configVarName in config) {
    return configVarName
  }
  return getConfigVarName(configVars)
}

exports.getConfigVarNameFromAttachment  = getConfigVarNameFromAttachment;

function formatAttachment (attachment) {
  let attName = cli.color.addon(attachment.name)

  let output = [cli.color.dim('as'), attName]
  let appInfo = `on ${cli.color.app(attachment.app.name)} app`
  output.push(cli.color.dim(appInfo))

  return output.join(' ')
}

function renderAttachment (attachment, app, isLast) {
  let line = isLast ? '└─' : '├─'
  let attName = formatAttachment(attachment)
  return printf(' %s %s', cli.color.dim(line), attName)
}

function presentCredentialAttachments (app, credAttachments, credentials, cred) {
  let isForeignApp = (attOrAddon) => attOrAddon.app.name !== app
  let atts = sortBy(credAttachments,
    isForeignApp,
    'name',
    'app.name'
  )
  // render each attachment under the credential
  let attLines = atts.map(function (attachment, idx) {
    let isLast = (idx === credAttachments.length - 1)
    return renderAttachment(attachment, app, isLast)
  })

  let rotationLines = []
  let credentialStore = credentials.filter(a => a.name === cred)[0]
  if (credentialStore.state === 'rotating') {
    let formatted = credentialStore.credentials.map(function (credential, idx) {
      return {
        'user': credential.user,
        'state': credential.state,
        'connections': credential.connections
      }
    })
    let connectionInformationAvailable = formatted.some((c) => c.connections != null)
    if (connectionInformationAvailable) {
      let prefix = '       '
      rotationLines.push(`${prefix}Usernames currently active for this credential:`)
      cli.table(formatted, {
        printHeader: false,
        printLine: function (line) { rotationLines.push(line) },
        columns: [
          { key: 'user', format: (v, r) => `${prefix}${v}` },
          { key: 'state', format: (v, r) => (v === 'revoking') ? 'waiting for no connections to be revoked' : v },
          { key: 'connections', format: (v, r) => `${v} connections` }
        ]
      })
    }
  }
  return [cred].concat(attLines).concat(rotationLines).join('\n')
}

exports.presentCredentialAttachments = presentCredentialAttachments

exports.getConnectionDetails = function (attachment, config) {
  const {getBastion} = require('./bastion')
  const url = require('url')

  const connstringVar = getConfigVarNameFromAttachment(attachment, config)

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

exports.legacyPlan = a => !!a.plan.name.match(/^legacy/)

exports.bastionKeyPlan = a => !!a.plan.name.match(/private/)

exports.configVarNamesFromValue = (config, value) => {
  let keys = []
  for (let key of Object.keys(config)) {
    let configVal = config[key]
    if (configVal === value) {
      keys.push(key)
    } else if (configVal.startsWith('postgres://')) {
      try {
        let configURL = new URL(configVal)
        let ourURL = new URL(value)
        let components = [ 'protocol', 'hostname', 'port', 'pathname' ]
        if (components.every((component) => ourURL[component] === configURL[component])) {
          keys.push(key)
        }
      } catch (err) {
        // ignore -- this is not a valid URL so not a matching URL
      }
    }
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

exports.parsePostgresConnectionString = (db) => {
  const url = require('url')

  db = url.parse(db.match(/:\/\//) ? db : `postgres:///${db}`)
  const [user, password] = db.auth ? db.auth.split(':') : []
  db.user = user
  db.password = password
  const databaseName = db.pathname || null
  if (databaseName && databaseName.charAt(0) === '/') {
    db.database = databaseName.slice(1) || null
  } else {
    db.database = databaseName
  }
  db.host = db.hostname
  db.port = db.port || env.PGPORT
  if (db.hostname) {
    db.port = db.port || 5432
  }
  return db
}
