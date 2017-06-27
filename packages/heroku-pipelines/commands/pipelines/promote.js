'use strict'

const co = require('co')
const assert = require('assert')
const cli = require('heroku-cli-util')
const BBPromise = require('bluebird')

const api = require('../../lib/api')
const keyBy = require('../../lib/key-by')
const listPipelineApps = api.listPipelineApps

const PROMOTION_ORDER = ['development', 'staging', 'production']

function isComplete (promotionTarget) {
  return promotionTarget.status !== 'pending'
}

function isSucceeded (promotionTarget) {
  return promotionTarget.status === 'succeeded'
}

function isFailed (promotionTarget) {
  return promotionTarget.status === 'failed'
}

function * getSecondFactor () {
  cli.yubikey.enable()
  const secondFactor = yield cli.prompt('Two-factor code', {mask: true})
  cli.yubikey.disable()
  return secondFactor
}

function pollPromotionStatus (heroku, id, needsReleaseCommand) {
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

    return BBPromise.delay(1000).then(pollPromotionStatus.bind(null, heroku, id, needsReleaseCommand))
  })
}

function* getCoupling (heroku, app) {
  return yield cli.action(`Fetching app info`, heroku.request({
    method: 'GET',
    path: `/apps/${app}/pipeline-couplings`
  }))
}

function* getApps (heroku, pipeline) {
  return yield cli.action(`Fetching apps from ${cli.color.pipeline(pipeline.name)}`,
    listPipelineApps(heroku, pipeline.id))
}

function* promote (heroku, label, id, sourceAppId, targetApps, secondFactor) {
  const options = {
    method: 'POST',
    path: `/pipeline-promotions`,
    body: {
      pipeline: {id: id},
      source: {app: {id: sourceAppId}},
      targets: targetApps.map((app) => { return {app: {id: app.id}} })
    }
  }

  if (secondFactor) {
    options.headers = {'Heroku-Two-Factor-Code': secondFactor}
  }

  try {
    return yield cli.action(label, heroku.request(options))
  } catch (error) {
    if (!error.body || error.body.id !== 'two_factor') {
      throw error
    }
    const secondFactor = yield getSecondFactor()
    return yield promote(heroku, label, id, sourceAppId, targetApps, secondFactor)
  }
}

function assertNotPromotingToSelf (source, target) {
  assert.notEqual(source, target, `Cannot promote from an app to itself: ${target}. Specify a different target app.`)
}

function assertValidPromotion (app, source, target) {
  if (target === null || PROMOTION_ORDER.indexOf(source) < 0) {
    throw new Error(`Cannot promote ${app} from '${source}' stage`)
  }
}

function assertApps (app, targetApps, targetStage) {
  if (targetApps.length < 1) {
    throw new Error(`Cannot promote from ${cli.color.app(app)} as there are no downstream apps in ${targetStage} stage`)
  }
}

function findAppInPipeline (apps, target) {
  const found = apps.find((app) => (app.name === target) || (app.id === target))
  assert(found, `Cannot find app ${cli.color.app(target)}`)

  return found
}

function* getRelease (heroku, app, release) {
  return yield cli.action(`Fetching release info`, heroku.request({
    method: 'GET',
    path: `/apps/${app}/releases/${release}`
  }))
}

function* streamReleaseCommand (heroku, targets, promotion) {
  if (targets.length !== 1 || targets.every(isComplete)) {
    return yield pollPromotionStatus(heroku, promotion.id, false)
  }
  const target = targets[0]
  const release = yield getRelease(heroku, target.app.id, target.release.id)

  if (!release.output_stream_url) {
    return yield pollPromotionStatus(heroku, promotion.id, false)
  }

  cli.log('Running release command...')
  yield new Promise(function (resolve, reject) {
    let stream = cli.got.stream(release.output_stream_url)
    stream.on('error', reject)
    stream.on('end', resolve)
    let piped = stream.pipe(process.stdout)
    piped.on('error', reject)
  })

  return yield pollPromotionStatus(heroku, promotion.id, false)
}

module.exports = {
  topic: 'pipelines',
  command: 'promote',
  description: 'promote the latest release of this app to its downstream app(s)',
  help: `Example:

    $ heroku pipelines:promote -a example-staging
    Promoting example-staging to example (production)... done, v23
    Promoting example-staging to example-admin (production)... done, v54

Example:

    $ heroku pipelines:promote -a example-staging --to my-production-app1,my-production-app2
    Starting promotion to apps: my-production-app1,my-production-app2... done
    Waiting for promotion to complete... done
    Promotion successful
    my-production-app1: succeeded
    my-production-app2: succeeded`,
  needsApp: true,
  needsAuth: true,
  flags: [
    {
      name: 'to',
      char: 't',
      description: 'comma separated list of apps to promote to',
      hasValue: true
    }
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const app = context.app
    const coupling = yield getCoupling(heroku, app)
    const allApps = yield getApps(heroku, coupling.pipeline)
    const sourceStage = coupling.stage

    let promotionActionName = ''
    let targetApps = []
    if (context.flags && context.flags.to) {
      // The user specified a specific set of apps they want to target
      // We don't have to infer the apps or the stage they want to promote to

      // Strip out any empty app names due to something like a trailing comma
      const targetAppNames = context.flags.to.split(',').filter((appName) => appName.length >= 1)

      // Now let's make sure that we can find every target app they specified
      // The only requirement is that the app be in this pipeline. They can be at any stage.
      targetApps = targetAppNames.map((targetAppNameOrId) => {
        assertNotPromotingToSelf(app, targetAppNameOrId)
        return findAppInPipeline(allApps, targetAppNameOrId)
      })

      promotionActionName = `Starting promotion to apps: ${targetAppNames.toString()}`
    } else {
      const targetStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1]

      assertValidPromotion(app, sourceStage, targetStage)

      targetApps = allApps.filter((app) => app.coupling.stage === targetStage)

      assertApps(app, targetApps, targetStage)

      promotionActionName = `Starting promotion to ${targetStage}`
    }

    const promotion = yield promote(
      heroku, promotionActionName, coupling.pipeline.id, coupling.app.id, targetApps
    )

    const pollLoop = pollPromotionStatus(heroku, promotion.id, true)
    let promotionTargets = yield cli.action('Waiting for promotion to complete', pollLoop)
    promotionTargets = yield streamReleaseCommand(heroku, promotionTargets, promotion)

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
  }))
}
