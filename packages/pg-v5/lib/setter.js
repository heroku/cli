'use strict'

const cli = require('heroku-cli-util')

exports.boolean = (value) => {
  switch (value) {
    case 'true': case 'TRUE': case 'ON': case 'on': case true:
      return true
    case 'false': case 'FALSE': case 'OFF': case 'off': case null: case false:
      return false
    default:
      throw new TypeError('Invalid value. Valid options are: a boolean value')
  }
}

exports.enum = (value) => {
  return value
}

exports.numeric = (value) => {
  let n = Number(value)
  if (!isFinite(n)) {
    throw new TypeError('Invalid value. Valid options are: a numeric value')
  }
  return n
}

exports.generate = (name, convert, explain) => {
  return async function run(context, heroku) {
    const host = require('./host')
    const util = require('./util')
    const fetcher = require('./fetcher')(heroku)
    const { app, args } = context
    const { value, database } = args

    const db = await fetcher.addon(app, database)

    if (util.starterPlan(db)) throw new Error('This operation is not supported by Hobby tier databases.')
    if (util.legacyPlan(db)) throw new Error('This operation is not supported by Legacy tier databases.')

    if (!value) {
      let settings = await heroku.get(`/postgres/v0/databases/${db.id}/config`, { host: host(db) })
      let setting = settings[name]
      cli.log(`${name.replace(/_/g, '-')} is set to ${setting.value} for ${db.name}.`)
      cli.log(explain(setting))
    } else {
      let settings = await heroku.patch(`/postgres/v0/databases/${db.id}/config`, {
        host: host(db),
        body: { [name]: convert(value) }
      })
      let setting = settings[name]
      cli.log(`${name.replace(/_/g, '-')} has been set to ${setting.value} for ${db.name}.`)
      cli.log(explain(setting))
    }
  };
}
