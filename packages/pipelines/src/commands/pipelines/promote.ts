import {APIClient, Command, flags} from '@heroku-cli/command'
import Heroku from '@heroku-cli/schema'
import {assert} from 'chai'
import cli from 'cli-ux'
import color from '@heroku-cli/color'

import {getApps, listPipelineApps} from '../../api'
import keyBy from '../../key-by'

function assertNotPromotingToSelf(source, target) {
  assert.notStrictEqual(source, target, `Cannot promote from an app to itself: ${target}. Specify a different target app.`)
}

function findAppInPipeline(apps, target) {
  const found = apps.find(app => (app.name === target) || (app.id === target))
  assert(found, `Cannot find app ${cli.color.app(target)}`)

  return found
}

const PROMOTION_ORDER = ['development', 'staging', 'production']

const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))

function isComplete(promotionTarget) {
  return promotionTarget.status !== 'pending'
}

function isSucceeded(promotionTarget) {
  return promotionTarget.status === 'succeeded'
}

function isFailed(promotionTarget) {
  return promotionTarget.status === 'failed'
}

async function getSecondFactor() {
  cli.yubikey.enable()
  const secondFactor = await cli.prompt('Two-factor code', {mask: true})
  cli.yubikey.disable()
  return secondFactor
}

function pollPromotionStatus(heroku, id, needsReleaseCommand) {
  return heroku.request({
    method: 'GET',
    path: `/pipeline-promotions/${id}/promotion-targets`
  }).then(function (targets) {
    if (targets.every(isComplete)) { return targets }

          //
          // With only one target, we can return as soon as the release is created.
          // The command will then read the release phase output
          //
          // `needsReleaseCommand` allows us to keep polling, as it can take a few
          // seconds to get the release to succeeded after the release command
          // finished.
          //
    if (needsReleaseCommand && targets.length === 1 && targets[0].release !== null) { return targets }

    const delay = new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
    return delay.then(pollPromotionStatus.bind(null, heroku, id, needsReleaseCommand))
  })
}

async function getCoupling(heroku, app) {
  return cli.action('Fetching app info', heroku.request({
    method: 'GET',
    path: `/apps/${app}/pipeline-couplings`
  }))
}

// async function getApps(heroku, pipeline) {
//   return cli.action(`Fetching apps from ${cli.color.pipeline(pipeline.name)}`,
//           listPipelineApps(heroku, pipeline.id))
// }

async function promote(heroku: APIClient, label: string, id: string, sourceAppId: string, targetApps: Array<Heroku.App>, secondFactor?: string) {
  const options = {
    headers: {},
    body: {
      pipeline: {id},
      source: {app: {id: sourceAppId}},
      targets: targetApps.map(app => ({app: {id: app.id}}))
    }
  }

  if (secondFactor) {
    options.headers = {'Heroku-Two-Factor-Code': secondFactor}
  }

  try {
    return await cli.action(label, heroku.post('/pipeline-promotions', options))
  } catch (error) {
    if (!error.body || error.body.id !== 'two_factor') {
      throw error
    }
    const secondFactor = await getSecondFactor()
    return promote(heroku, label, id, sourceAppId, targetApps, secondFactor)
  }
}

function assertValidPromotion(app, source, target) {
  if (target === null || PROMOTION_ORDER.indexOf(source) < 0) {
    throw new Error(`Cannot promote ${app} from '${source}' stage`)
  }
}

function assertApps(app, targetApps, targetStage) {
  if (targetApps.length < 1) {
    throw new Error(`Cannot promote from ${cli.color.app(app)} as there are no downstream apps in ${targetStage} stage`)
  }
}

function * getRelease(heroku, app, release) {
  return yield cli.action('Fetching release info', heroku.request({
    method: 'GET',
    path: `/apps/${app}/releases/${release}`
  }))
}

function * streamReleaseCommand(heroku, targets, promotion) {
  if (targets.length !== 1 || targets.every(isComplete)) {
    return yield pollPromotionStatus(heroku, promotion.id, false)
  }
  const target = targets[0]
  const release = yield getRelease(heroku, target.app.id, target.release.id)

  if (!release.output_stream_url) {
    return yield pollPromotionStatus(heroku, promotion.id, false)
  }

  cli.log('Running release command...')
  const fetch = (retry = 100) => new Promise((resolve, reject) => {
    const stream = cli.got.stream(release.output_stream_url)
    stream.on('error', async err => {
      await wait(100)
      if (retry && err.statusCode === 404) {
        fetch(retry - 1).then(resolve).catch(reject)
      } else reject(err)
    })
    stream.on('end', resolve)
    const piped = stream.pipe(process.stdout)
    piped.on('error', reject)
  })
  yield fetch()

  return yield pollPromotionStatus(heroku, promotion.id, false)
}

export default class Promote extends Command {
  static description = 'promote the latest release of this app to its downstream app(s)'

  static examples = [`$ heroku pipelines:promote -a example-staging
  Promoting example-staging to example (production)... done, v23
  Promoting example-staging to example-admin (production)... done, v54

  $ heroku pipelines:promote -a example-staging --to my-production-app1,my-production-app2
  Starting promotion to apps: my-production-app1,my-production-app2... done
  Waiting for promotion to complete... done
  Promotion successful
  my-production-app1: succeeded
  my-production-app2: succeeded`]

  static flags = {
    app: flags.app({
      required: true
    }),
    remote: flags.remote(),
    to: flags.string({
      char: 't',
      description: 'comma separated list of apps to promote to',
    })
  }

  async run() {
    const {flags} = this.parse(Promote)
    const app = flags.app
    const coupling = await getCoupling(this.heroku, app)
    cli.action.start(`Fetching apps from ${color.pipeline(coupling.pipeline.name)}`)
    const allApps = await listPipelineApps(this.heroku, coupling.pipeline.id)
    cli.action.stop()
    const sourceStage = coupling.stage

    let promotionActionName = ''
    let targetApps = []
    if (flags.to) {
      // The user specified a specific set of apps they want to target
      // We don't have to infer the apps or the stage they want to promote to

      // Strip out any empty app names due to something like a trailing comma
      const targetAppNames = flags.to.split(',').filter(appName => appName.length >= 1)

      // Now let's make sure that we can find every target app they specified
      // The only requirement is that the app be in this pipeline. They can be at any stage.
      targetApps = targetAppNames.map(targetAppNameOrId => {
        assertNotPromotingToSelf(app, targetAppNameOrId)
        return findAppInPipeline(allApps, targetAppNameOrId)
      })

      promotionActionName = `Starting promotion to apps: ${targetAppNames.toString()}`
    } else {
      const targetStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1]

      assertValidPromotion(app, sourceStage, targetStage)

      targetApps = allApps.filter(app => app.coupling.stage === targetStage)

      assertApps(app, targetApps, targetStage)

      promotionActionName = `Starting promotion to ${targetStage}`
    }

    const promotion = await promote(
      this.heroku, promotionActionName, coupling.pipeline.id, coupling.app.id, targetApps
    )

    const pollLoop = pollPromotionStatus(this.heroku, promotion.id, true)
    cli.action.start('Waiting for promotion to complete')
    let promotionTargets = await pollLoop
    promotionTargets = await streamReleaseCommand(this.heroku, promotionTargets, promotion)
    cli.action.stop()

    const appsByID = keyBy(allApps, 'id')

    const styledTargets = promotionTargets.reduce(function (memo, target) {
      const app = appsByID[target.app.id]
      const details = [target.status]

      if (isFailed(target)) { details.push(target.error_message) }

      memo[app.name] = details
      return memo
    }, {})

    if (promotionTargets.every(isSucceeded)) {
      cli.log('\nPromotion successful')
    } else {
      cli.warn('\nPromotion to some apps failed')
    }

    cli.styledHash(styledTargets)
  }
}
