import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {pipelineCouplingExtensions} from '@heroku/sdk/extensions/platform'
import type {AppWithPipelineCoupling} from '@heroku/sdk/resources/platform/pipeline-coupling'
import {promotePipeline, type ReleaseStreamContext} from '@heroku/sdk/resources/platform/pipeline-promotion'
import {ux} from '@oclif/core/ux'
import assert from 'node:assert'

import keyBy from '../../lib/pipelines/key-by.js'

function assertNotPromotingToSelf(source: string, target: string) {
  assert.notStrictEqual(source, target, `Cannot promote from an app to itself: ${target}. Specify a different target app.`)
}

function findAppInPipeline(apps: Array<AppWithPipelineCoupling>, target: string) {
  const found = apps.find(app => (app.name === target) || (app.id === target))
  assert(found, `Cannot find app ${color.app(target)}`)

  return found
}

const PROMOTION_ORDER = ['development', 'staging', 'production']

export default class Promote extends Command {
  static description = 'promote the latest release of this app to its downstream app(s)'
  static examples = [
    color.command('heroku pipelines:promote -a my-app-staging'),
  ]
  static flags = {
    app: flags.app({
      required: true,
    }),
    remote: flags.remote(),
    to: flags.string({
      char: 't',
      description: 'comma separated list of apps to promote to',
    }),
  }
  // Static reference so tests can stub the SDK call without changing the
  // command's behavior in production.
  public static promotePipeline = promotePipeline

  async run() {
    const {flags} = await this.parse(Promote)
    const appNameOrId = flags.app
    const coupling = await getCoupling(this.heroku, appNameOrId)
    ux.stdout(`Fetching apps from ${color.pipeline(coupling.pipeline!.name)}...`)
    const sdk = new HerokuSDK({extensions: [pipelineCouplingExtensions]})
    const {platform} = sdk
    const allApps = await platform.pipelineCoupling.listApps(coupling.pipeline!.id!)
    const sourceStage = coupling.stage

    let promotionActionName = ''
    let targetApps: Array<AppWithPipelineCoupling> = []
    if (flags.to) {
      // The user specified a specific set of apps they want to target
      // We don't have to infer the apps or the stage they want to promote to

      // Strip out any empty app names due to something like a trailing comma
      const targetAppNames = flags.to.split(',').filter((appName: string) => appName.length > 0)

      // Now let's make sure that we can find every target app they specified
      // The only requirement is that the app be in this pipeline. They can be at any stage.
      targetApps = targetAppNames.reduce((acc: Array<AppWithPipelineCoupling>, targetAppNameOrId: string) => {
        assertNotPromotingToSelf(appNameOrId, targetAppNameOrId)
        const app = findAppInPipeline(allApps, targetAppNameOrId)
        if (app) {
          acc.push(app)
        }

        return acc
      }, [])

      promotionActionName = `Starting promotion to apps: ${targetAppNames.toString()}`
    } else {
      const targetStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage!) + 1]

      assertValidPromotion(appNameOrId, sourceStage!, targetStage)

      targetApps = allApps.filter(app => app.pipelineCoupling.stage === targetStage)

      assertApps(appNameOrId, targetApps, targetStage)

      promotionActionName = `Starting promotion to ${targetStage}`
    }

    ux.stdout(`${promotionActionName}...`)
    ux.stdout('Waiting for promotion to complete...')

    let releaseStreamError: unknown
    const onReleaseStream = async ({stream}: ReleaseStreamContext) => {
      ux.stdout('Running release command...')
      try {
        await stream.pipeTo(new WritableStream({
          write(chunk) {
            process.stdout.write(Buffer.from(chunk))
          },
        }))
      } catch (error) {
        releaseStreamError = error
      }
    }

    const {targets: promotionTargets} = await Promote.promotePipeline(
      {platform},
      {
        pipeline: {id: coupling.pipeline!.id!},
        source: {app: {id: coupling.app!.id!}},
        targets: targetApps.map(app => ({app: {id: app.id}})),
      },
      {onReleaseStream},
    )

    if (releaseStreamError) {
      ux.error(releaseStreamError as Error)
    }

    const appsByID = keyBy(allApps, 'id')

    const styledTargets = promotionTargets.reduce((memo: Heroku.App, target: any) => {
      const app = appsByID[target.app.id]
      const details = [target.status]

      if (isFailed(target)) {
        details.push(target.error_message)
      }

      memo[app.name] = details
      return memo
    }, {})

    if (promotionTargets.every(isSucceeded)) {
      ux.stdout('\nPromotion successful')
    } else {
      ux.warn('\nPromotion to some apps failed')
    }

    hux.styledObject(styledTargets)
  }
}

function assertApps(app: string, targetApps: Array<AppWithPipelineCoupling>, targetStage: string) {
  if (targetApps.length === 0) {
    throw new Error(`Cannot promote from ${color.app(app)} as there are no downstream apps in ${targetStage} stage`)
  }
}

function assertValidPromotion(app: string, source: string, target?: string) {
  if (!target || PROMOTION_ORDER.indexOf(source) < 0) { // eslint-disable-line unicorn/prefer-includes
    throw new Error(`Cannot promote ${app} from '${source}' stage`)
  }
}

async function getCoupling(heroku: APIClient, app: string): Promise<Heroku.PipelineCoupling> {
  ux.stdout('Fetching app info...')
  const {body: coupling} = await heroku.get<Heroku.PipelineCoupling>(`/apps/${app}/pipeline-couplings`)
  return coupling
}

function isFailed(promotionTarget: Heroku.PipelinePromotionTarget) {
  return promotionTarget.status === 'failed'
}

function isSucceeded(promotionTarget: Heroku.PipelinePromotionTarget) {
  return promotionTarget.status === 'succeeded'
}
