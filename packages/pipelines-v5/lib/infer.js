'use strict'

const stages = require('./stages').inferrableStages

module.exports = function infer (app) {
  const inferredStage = stages.find(stage => stage.inferRegex.test(app))

  if (inferredStage) {
    return [ app.replace(inferredStage.inferRegex, ''), inferredStage.name ]
  }

  return [ app, 'production' ]
}
