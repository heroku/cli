import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {createPipelineTransfer, getAccountInfo, getTeam, listPipelineApps} from '../../lib/api'
import disambiguate from '../../lib/pipelines/disambiguate'
import renderPipeline from '../../lib/pipelines/render-pipeline'

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
    '$ heroku pipelines:transfer admin@example.com -p my-pipeline',
    '$ heroku pipelines:transfer admin-team -p my-pipeline',
  ]

  static args = {
    owner: Args.string({
      description: 'the owner to transfer the pipeline to',
      required: true,
    }),
  }

  static flags = {
    pipeline: flags.pipeline({required: true}),
    confirm: flags.string({char: 'c'}),
  }

  async run() {
    const {args, flags} = await this.parse(PipelinesTransfer)
    const pipeline = await disambiguate(this.heroku, flags.pipeline)
    const newOwner = await getOwner(this.heroku, args.owner)
    const apps = await listPipelineApps(this.heroku, pipeline.id!)
    const displayType = newOwner.type === 'user' ? 'account' : newOwner.type
    let confirmName = flags.confirm

    if (!confirmName) {
      await renderPipeline(this.heroku, pipeline, apps)
      ux.log('')
      ux.warn(`This will transfer ${color.pipeline(pipeline.name!)} and all of the listed apps to the ${args.owner} ${displayType}`)
      ux.warn(`to proceed, type ${color.red(pipeline.name!)} or re-run this command with ${color.red('--confirm')} ${pipeline.name}`)
      confirmName = await ux.prompt('', {})
    }

    if (confirmName !== pipeline.name) {
      ux.warn(`Confirmation did not match ${color.red(pipeline.name!)}. Aborted.`)
      return
    }

    ux.action.start(`Transferring ${color.pipeline(pipeline.name!)} pipeline to the ${args.owner} ${displayType}`)
    await createPipelineTransfer(this.heroku, {pipeline: {id: pipeline.id}, new_owner: newOwner})
    ux.action.stop()
  }
}
