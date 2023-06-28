import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'
import assert from 'assert'
import fetch from 'node-fetch'
import Stream from 'stream'
import util from 'util'

import {listPipelineApps} from 'src/lib/pipelines/api'
import keyBy from 'src/lib/pipelines/key-by'

const cli = CliUx.ux

export const sleep  = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time))
}

function assertNotPromotingToSelf(source: string, target: string) {
  assert.notStrictEqual(source, target, `Cannot promote from an app to itself: ${target}. Specify a different target app.`)
}

function findAppInPipeline(apps: Array<Heroku.App>, target: string) {
  const found = apps.find(app => (app.name === target) || (app.id === target))
  assert(found, `Cannot find app ${color.app(target)}`)

  return found
}

const PROMOTION_ORDER = ['development', 'staging', 'production']

const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))

function isComplete(promotionTarget: Heroku.PipelinePromotionTarget) {
  return promotionTarget.status !== 'pending'
}

function isSucceeded(promotionTarget: Heroku.PipelinePromotionTarget) {
  return promotionTarget.status === 'succeeded'
}

function isFailed(promotionTarget: Heroku.PipelinePromotionTarget) {
  return promotionTarget.status === 'failed'
}

function pollPromotionStatus(heroku: APIClient, id: string, needsReleaseCommand: boolean): Promise<Array<Heroku.PipelinePromotionTarget>> {
  return heroku.get<Array<Heroku.PipelinePromotionTarget>>(`/pipeline-promotions/${id}/promotion-targets`).then(function ({body: targets}) {
    if (targets.every(isComplete)) { // eslint-disable-line unicorn/no-array-callback-reference
      return targets
    }

    //
    // With only one target, we can return as soon as the release is created.
    // The command will then read the release phase output
    //
    // `needsReleaseCommand` allows us to keep polling, as it can take a few
    // seconds to get the release to succeeded after the release command
    // finished.
    //
    if (needsReleaseCommand && targets.length === 1 && targets[0].release !== null) {
      return targets
    }

    return wait(1000).then(pollPromotionStatus.bind(null, heroku, id, needsReleaseCommand))
  })
}

async function getCoupling(heroku: APIClient, app: string): Promise<Heroku.PipelineCoupling> {
  cli.log('Fetching app info...')
  const {body: coupling} = await heroku.get<Heroku.PipelineCoupling>(`/apps/${app}/pipeline-couplings`)
  return coupling
}

async function promote(heroku: APIClient, label: string, id: string, sourceAppId: string, targetApps: Array<Heroku.App>, secondFactor?: string): Promise<Heroku.PipelinePromotion> {
  const options = {
    headers: {},
    body: {
      pipeline: {id},
      source: {app: {id: sourceAppId}},
      targets: targetApps.map(app => ({app: {id: app.id}})),
    },
  }

  if (secondFactor) {
    options.headers = {'Heroku-Two-Factor-Code': secondFactor}
  }

  try {
    cli.log(`${label}...`)
    const {body: promotions} = await heroku.post<Heroku.PipelinePromotion>('/pipeline-promotions', options)
    return promotions
  } catch (error: any) {
    if (!error.body || error.body.id !== 'two_factor') {
      throw error
    }

    const secondFactor = await heroku.twoFactorPrompt()
    return promote(heroku, label, id, sourceAppId, targetApps, secondFactor)
  }
}

function assertValidPromotion(app: string, source: string, target?: string) {
  if (!target || PROMOTION_ORDER.indexOf(source) < 0) { // eslint-disable-line unicorn/prefer-includes
    throw new Error(`Cannot promote ${app} from '${source}' stage`)
  }
}

function assertApps(app: string, targetApps: Array<Heroku.App>, targetStage: string) {
  if (targetApps.length === 0) {
    throw new Error(`Cannot promote from ${color.app(app)} as there are no downstream apps in ${targetStage} stage`)
  }
}

async function getRelease(heroku: APIClient, app: string, releaseId: string): Promise<Heroku.Release> {
  cli.log('Fetching release info...')
  const {body: release} = await heroku.get<Heroku.Release>(`/apps/${app}/releases/${releaseId}`)
  return release
}

async function streamReleaseCommand(heroku: APIClient, targets: Array<Heroku.App>, promotion: any) {
  if (targets.length !== 1 || targets.every(isComplete)) { // eslint-disable-line unicorn/no-array-callback-reference
    return pollPromotionStatus(heroku, promotion.id, false)
  }

  const target = targets[0]
  const release = await getRelease(heroku, target.app.id, target.release.id)

  if (!release.output_stream_url) {
    return pollPromotionStatus(heroku, promotion.id, false)
  }

  cli.log('Running release command...')

  async function streamReleaseOutput(releaseStreamUrl: string) {
    const finished = util.promisify(Stream.finished)
    const fetchResponse = await fetch(releaseStreamUrl)

    if (fetchResponse.status >= 400) {
      throw new Error('stream release output not available')
    }

    fetchResponse.body.pipe(process.stdout)

    await finished(fetchResponse.body)
  }

  async function retry(maxAttempts: number, fn: () => Promise<any>) {
    let currentAttempt = 0

    while (true) {
      try {
        await fn()
        return
      } catch (error) {
        if (++currentAttempt === maxAttempts) {
          throw error
        }

        await sleep(1000)
      }
    }
  }

  await retry(100, () => {
    return streamReleaseOutput(release.output_stream_url!)
  })

  return pollPromotionStatus(heroku, promotion.id, false)
}

export default class Promote extends Command {
  static description = 'promote the latest release of this app to its downstream app(s)'

  static examples = [
    '$ heroku pipelines:promote -a my-app-staging',
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

  async run() {
    const {flags} = await this.parse(Promote)
    const appNameOrId = flags.app
    const coupling = await getCoupling(this.heroku, appNameOrId)
    cli.log(`Fetching apps from ${color.pipeline(coupling.pipeline!.name)}...`)
    const allApps = await listPipelineApps(this.heroku, coupling.pipeline!.id!)
    const sourceStage = coupling.stage

    let promotionActionName = ''
    let targetApps: Array<Heroku.App> = []
    if (flags.to) {
      // The user specified a specific set of apps they want to target
      // We don't have to infer the apps or the stage they want to promote to

      // Strip out any empty app names due to something like a trailing comma
      const targetAppNames = flags.to.split(',').filter(appName => appName.length > 0)

      // Now let's make sure that we can find every target app they specified
      // The only requirement is that the app be in this pipeline. They can be at any stage.
      targetApps = targetAppNames.reduce((acc: Array<Heroku.App>, targetAppNameOrId) => {
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

      targetApps = allApps.filter(app => app.coupling.stage === targetStage)

      assertApps(appNameOrId, targetApps, targetStage)

      promotionActionName = `Starting promotion to ${targetStage}`
    }

    const promotion = await promote(
      this.heroku, promotionActionName, coupling.pipeline!.id!, coupling.app!.id!, targetApps,
    )

    const pollLoop = pollPromotionStatus(this.heroku, promotion.id!, true)
    cli.log('Waiting for promotion to complete...')
    let promotionTargets = await pollLoop

    try {
      promotionTargets = await streamReleaseCommand(this.heroku, promotionTargets, promotion)
    } catch (error: any) {
      cli.error(error)
    }

    const appsByID = keyBy(allApps, 'id')

    const styledTargets = promotionTargets.reduce(function (memo: Heroku.App, target: Heroku.App) {
      const app = appsByID[target.app.id]
      const details = [target.status]

      if (isFailed(target)) {
        details.push(target.error_message)
      }

      memo[app.name] = details
      return memo
    }, {})

    if (promotionTargets.every(isSucceeded)) { // eslint-disable-line unicorn/no-array-callback-reference
      cli.log('\nPromotion successful')
    } else {
      cli.warn('\nPromotion to some apps failed')
    }

    cli.styledObject(styledTargets)
  }
}
