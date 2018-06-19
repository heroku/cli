const cli = require('heroku-cli-util')
const sortBy = require('lodash.sortby')
const PipelineOwner = require('./ownership')

function * renderPipeline (heroku, pipeline, pipelineApps, { withOwners, showOwnerWarning } = { withOwners: false, showOwnerWarning: false }) {
  cli.styledHeader(pipeline.name)

  let owner
  if (pipeline.owner) {
    owner = yield PipelineOwner.getOwner(heroku, pipelineApps, pipeline)
    cli.log(`owner: ${owner}`)
  }
  cli.log('')

  let columns = [
    {key: 'name', label: 'app name', format: (n) => cli.color.app(n)},
    {key: 'coupling.stage', label: 'stage'}
  ]

  if (withOwners) {
    columns.push({
      key: 'owner.email', label: 'owner', format: (e) => e.endsWith('@herokumanager.com') ? `${e.split('@')[0]} (team)` : e
    })
  }

  const developmentApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'development'), ['name'])
  const reviewApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'review'), ['name'])
  const stagingApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'staging'), ['name'])
  const productionApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'production'), ['name'])
  const apps = developmentApps.concat(reviewApps).concat(stagingApps).concat(productionApps)

  cli.table(apps, { columns })

  if (showOwnerWarning && pipeline.owner) {
    PipelineOwner.warnMixedOwnership(pipelineApps, pipeline, owner)
  }
}

module.exports = renderPipeline
