'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const disambiguate = require('../../lib/disambiguate')
const api = require('../../lib/api')
const renderPipeline = require('../../lib/render-pipeline')
const { flags } = require('@heroku-cli/command')

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
    === example

    app name              stage
    ────────────────────  ───────────
    ⬢ example-dev         development
    ⬢ example-staging     staging
    ⬢ example-prod        production

     ▸    This will transfer example and all of the listed apps to the me@example.com account
     ▸    to proceed, type edamame or re-run this command with --confirm example
    > example
    Transferring example pipeline to the me@example.com account... done

    $ heroku pipelines:transfer acme-widgets -p example
    === example

    app name              stage
    ────────────────────  ───────────
    ⬢ example-dev         development
    ⬢ example-staging     staging
    ⬢ example-prod        production

     ▸    This will transfer example and all of the listed apps to the acme-widgets team
     ▸    to proceed, type edamame or re-run this command with --confirm example
    > example

    Transferring example pipeline to the acme-widgets team... done`,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'owner', description: 'the owner to transfer the pipeline to', optional: false}
  ],
  flags: [
    flags.pipeline({ name: 'pipeline', required: true, hasValue: true }),
    { name: 'confirm', char: 'c', hasValue: true }
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const pipeline = yield disambiguate(heroku, context.flags.pipeline)
    const newOwner = yield getOwner(heroku, context.args.owner)
    const apps = yield api.listPipelineApps(heroku, pipeline.id)
    const displayType = { team: 'team', user: 'account' }[newOwner.type]
    let confirmName = context.flags.confirm

    if (!confirmName) {
      yield renderPipeline(heroku, pipeline, apps)
      cli.log('')
      cli.warn(`This will transfer ${cli.color.pipeline(pipeline.name)} and all of the listed apps to the ${context.args.owner} ${displayType}`)
      cli.warn(`to proceed, type ${cli.color.red(pipeline.name)} or re-run this command with ${cli.color.red('--confirm')} ${pipeline.name}`)
      confirmName = yield cli.prompt('', {})
    }

    if (confirmName !== pipeline.name) {
      cli.warn(`Confirmation did not match ${cli.color.red(pipeline.name)}. Aborted.`)
      return
    }

    const promise = heroku.request({
      method: 'POST',
      path: '/pipeline-transfers',
      body: { pipeline: { id: pipeline.id }, new_owner: newOwner },
      headers: {'Accept': 'application/vnd.heroku+json; version=3.pipelines'}
    })

    yield cli.action(
      `Transferring ${cli.color.pipeline(pipeline.name)} pipeline to the ${context.args.owner} ${displayType}`,
      promise
    )
  }))
}
