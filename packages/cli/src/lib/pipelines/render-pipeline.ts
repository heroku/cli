import color from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {sortBy} from 'lodash'

import {getOwner, warnMixedOwnership} from './ownership'

export default async function renderPipeline(
  heroku: APIClient,
  pipeline: Heroku.Pipeline,
  pipelineApps: Array<Heroku.App>,
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  {withOwners, showOwnerWarning} = {withOwners: false, showOwnerWarning: false}) {
  ux.styledHeader(pipeline.name!)

  let owner

  if (pipeline.owner) {
    owner = await getOwner(heroku, pipelineApps, pipeline)
    ux.log(`owner: ${owner}`)
  }

  ux.log('')

  const columns: ux.Table.table.Columns<Heroku.App> = {
    name: {
      header: 'app name',
      get(row) {
        return color.app(row.name || '')
      },
    },
    'coupling.stage': {
      header: 'stage',
      get(row) {
        return row.coupling.stage
      },
    },
  }

  if (withOwners) {
    columns['owner.email'] = {
      header: 'owner',
      get(row) {
        const email = row.owner && row.owner.email

        if (email) {
          return email.endsWith('@herokumanager.com') ? `${row.split('@')[0]} (team)` : email
        }
      },
    }
  }

  const developmentApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'development'), ['name'])
  const reviewApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'review'), ['name'])
  const stagingApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'staging'), ['name'])
  const productionApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'production'), ['name'])
  const apps = developmentApps.concat(reviewApps).concat(stagingApps).concat(productionApps)

  ux.table(apps, columns)

  if (showOwnerWarning && pipeline.owner) {
    warnMixedOwnership(pipelineApps, pipeline, owner)
  }
}
