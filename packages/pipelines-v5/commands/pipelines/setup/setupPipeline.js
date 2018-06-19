const cli = require('heroku-cli-util')

function setupPipeline (kolkrabbi, app, settings, pipelineID, ciSettings = {}) {
  const promises = [kolkrabbi.updateAppLink(app, settings)]

  if (ciSettings.ci) {
    promises.push(
      kolkrabbi.updatePipelineRepository(pipelineID, ciSettings)
    )
  }

  return Promise.all(promises).then(([appLink]) => {
    return appLink
  }, (error) => {
    cli.error(error.response.body.message)
  })
}

module.exports = setupPipeline
