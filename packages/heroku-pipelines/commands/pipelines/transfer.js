'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const disambiguate = require('../../lib/disambiguate')
const api = require('../../lib/api')
const { flags } = require('cli-engine-heroku')

function * getTeamOwner (heroku, name) {
  const team = yield api.getTeam(heroku, name)
  return { id: team.id, type: 'team' }
}

function * getAccountOwner (heroku, name) {
  const account = yield api.getAccountInfo(heroku, name)
  return { id: account.id, type: 'user' }
}

function * getOwner (heroku, name) {
  try {
    return yield getTeamOwner(heroku, name)
  } catch (e) {}

  try {
    return yield getAccountOwner(heroku, name)
  } catch (e) {
    throw new Error(`Cannot find a team or account for "${name}"`)
  }
}

module.exports = {
  topic: 'pipelines',
  command: 'transfer',
  description: 'transfer ownership of a pipeline',
  help: `Example:

    $ heroku pipelines:transfer me@example.com -p example
    Transferring example pipeline to the me@example.com account... done

    $ heroku pipelines:transfer acme-widgets -p example
    Transferring example pipeline to the acme-widgets team... done`,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'owner', description: 'the owner to transfer the pipeline to', optional: false}
  ],
  flags: [
    flags.pipeline({ name: 'pipeline', required: true, hasValue: true })
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const pipeline = yield disambiguate(heroku, context.flags.pipeline)
    const newOwner = yield getOwner(heroku, context.args.owner)

    const promise = heroku.request({
      method: 'PATCH',
      path: `/pipelines/${pipeline.id}`,
      body: { owner: newOwner },
      headers: {'Accept': 'application/vnd.heroku+json; version=3.pipelines'}
    })

    let displayType = { team: 'team', user: 'account' }[newOwner.type]

    yield cli.action(
      `Transferring ${cli.color.pipeline(pipeline.name)} pipeline to the ${context.args.owner} ${displayType}`,
      promise
    )
  }))
}
