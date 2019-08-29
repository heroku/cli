import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

import {createPipelineTransfer, getAccountInfo, getTeam, listPipelineApps} from '../../api'
import disambiguate from '../../disambiguate'
import renderPipeline from '../../render-pipeline'

async function getTeamOwner(heroku: APIClient, name: string) {
  const {body: team} = await getTeam(heroku, name)
  return {id: team.id, type: 'team'}
}

async function getAccountOwner(heroku: APIClient, name: string) {
  const {body: account} = await getAccountInfo(heroku, name)
  return {id: account.id, type: 'user'}
}

function getOwner(heroku: APIClient, name: string) {
  return getTeamOwner(heroku, name)
    .catch(() => {
      return getAccountOwner(heroku, name)
    })
    .catch(() => {
      throw new Error(`Cannot find a team or account for "${name}"`)
    })
}

export default class PipelinesTransfer extends Command {
  static description = 'transfer ownership of a pipeline'
  static examples = [
    '$ heroku pipelines:transfer me@example.com -p example',
    '$ heroku pipelines:transfer acme-widgets -p example'
  ]

  static args = [
    {
      name: 'owner',
      description: 'the owner to transfer the pipeline to',
      required: true
    }
  ]

  static flags = {
    pipeline: flags.pipeline({required: true}),
    confirm: flags.string({char: 'c'})
  }

  async run() {
    const {args, flags} = this.parse(PipelinesTransfer)
    const pipeline = await disambiguate(this.heroku, flags.pipeline)
    const newOwner = await getOwner(this.heroku, args.owner)
    const apps = await listPipelineApps(this.heroku, pipeline.id!)
    const displayType = newOwner.type === 'user' ? 'account' : newOwner.type
    let confirmName = flags.confirm

    if (!confirmName) {
      await renderPipeline(this.heroku, pipeline, apps)
      cli.log('')
      cli.warn(`This will transfer ${color.pipeline(pipeline.name!)} and all of the listed apps to the ${args.owner} ${displayType}`)
      cli.warn(`to proceed, type ${color.red(pipeline.name!)} or re-run this command with ${color.red('--confirm')} ${pipeline.name}`)
      confirmName = await cli.prompt('', {})
    }

    if (confirmName !== pipeline.name) {
      cli.warn(`Confirmation did not match ${color.red(pipeline.name!)}. Aborted.`)
      return
    }

    cli.action.start(`Transferring ${color.pipeline(pipeline.name!)} pipeline to the ${args.owner} ${displayType}`)
    await createPipelineTransfer(this.heroku, {pipeline: {id: pipeline.id}, new_owner: newOwner})
    cli.action.stop()
  }
}

// module.exports = {
//   topic: 'pipelines',
//   command: 'transfer',
//   description: 'transfer ownership of a pipeline',
//   examples: `$ heroku pipelines:transfer me@example.com -p example
// === example

// app name              stage
// ────────────────────  ───────────
// ⬢ example-dev         development
// ⬢ example-staging     staging
// ⬢ example-prod        production

//  ▸    This will transfer example and all of the listed apps to the me@example.com account
//  ▸    to proceed, type example or re-run this command with --confirm example
// > example
// Transferring example pipeline to the me@example.com account... done

// $ heroku pipelines:transfer acme-widgets -p example
// === example

// app name              stage
// ────────────────────  ───────────
// ⬢ example-dev         development
// ⬢ example-staging     staging
// ⬢ example-prod        production

//  ▸    This will transfer example and all of the listed apps to the acme-widgets team
//  ▸    to proceed, type example or re-run this command with --confirm example
// > example

// Transferring example pipeline to the acme-widgets team... done`,
//   needsApp: false,
//   needsAuth: true,
//   args: [
//     { name: 'owner', description: 'the owner to transfer the pipeline to', optional: false }
//   ],
//   flags: [
//     flags.pipeline({ name: 'pipeline', required: true, hasValue: true }),
//     { name: 'confirm', char: 'c', hasValue: true }
//   ],
//   run: cli.command(co.wrap(function* (context, heroku) {
//     const pipeline = yield disambiguate(heroku, flags.pipeline)
//     const newOwner = yield getOwner(heroku, context.args.owner)
//     const apps = yield listPipelineApps(heroku, pipeline.id)
//     const displayType = { team: 'team', user: 'account' }[newOwner.type]
//     let confirmName = context.flags.confirm

//     if (!confirmName) {
//       yield renderPipeline(heroku, pipeline, apps)
//       cli.log('')
//       cli.warn(`This will transfer ${color.pipeline(pipeline.name)} and all of the listed apps to the ${context.args.owner} ${displayType}`)
//       cli.warn(`to proceed, type ${color.red(pipeline.name)} or re-run this command with ${cli.color.red('--confirm')} ${pipeline.name}`)
//       confirmName = yield cli.prompt('', {})
//     }

//     if (confirmName !== pipeline.name) {
//       cli.warn(`Confirmation did not match ${cli.color.red(pipeline.name)}. Aborted.`)
//       return
//     }

//     const promise = heroku.request({
//       method: 'POST',
//       path: '/pipeline-transfers',
//       body: { pipeline: { id: pipeline.id }, new_owner: newOwner },
//       headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
//     })

//     yield cli.action(
//       `Transferring ${cli.color.pipeline(pipeline.name)} pipeline to the ${context.args.owner} ${displayType}`,
//       promise
//     )
//   }))
// }
