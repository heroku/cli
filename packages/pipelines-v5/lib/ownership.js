const cli = require('heroku-cli-util')
const getTeam = require('./api').getTeam
const Promise = require('bluebird')

function warnMixedOwnership (pipelineApps, pipeline, owner) {
  const hasMixedOwnership = pipelineApps.some((app) => {
    return app.owner.id !== pipeline.owner.id
  })

  if (hasMixedOwnership) {
    cli.log()
    let message = `Some apps in this pipeline do not belong to ${cli.color.cmd(owner)}.`
    message += `\n\nAll apps in a pipeline must have the same owner as the pipeline owner.`
    message += `\nTransfer these apps or change the pipeline owner in pipeline settings.`
    message += `\nSee ${cli.color.cyan('https://devcenter.heroku.com/articles/pipeline-ownership-transition')} for more info.`
    cli.warn(message)
  }
}

function getOwner (heroku, apps, pipeline) {
  let owner, ownerPromise

  if (pipeline.owner.type === 'team') {
    ownerPromise = getTeam(heroku, pipeline.owner.id)
  } else {
    const app = apps.find((app) => {
      return app.owner.id === pipeline.owner.id
    })

    // If pipeline owner doesn't own any application and type is user (unlikely)
    // We return the uuid as default
    owner = app ? app.owner.email : pipeline.owner.id
    ownerPromise = Promise.resolve(owner)
  }

  return ownerPromise.then((owner) => {
    return owner.name ? `${owner.name} (team)` : owner
  })
}

module.exports = {
  getOwner,
  warnMixedOwnership
}
