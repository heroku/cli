import {color} from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

import {getOwner, warnMixedOwnership} from './ownership.js'
import {AppWithPipelineCoupling} from '../api.js'

export default async function renderPipeline(
  heroku: APIClient,
  pipeline: Heroku.Pipeline,
  pipelineApps: Array<AppWithPipelineCoupling>,
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  {withOwners, showOwnerWarning} = {withOwners: false, showOwnerWarning: false}) {
  hux.styledHeader(pipeline.name!)

  let owner

  if (pipeline.owner) {
    owner = await getOwner(heroku, pipelineApps, pipeline)
    ux.stdout(`owner: ${owner}`)
  }

  ux.stdout('')

  const columns: Parameters<typeof hux.table<AppWithPipelineCoupling>>[1] = {
    name: {
      header: 'app name',
      get(row) {
        return color.app(row.name || '')
      },
    },
    'coupling.stage': {
      header: 'stage',
      get(row) {
        return row.pipelineCoupling.stage
      },
    },
  }

  if (withOwners) {
    columns['owner.email'] = {
      header: 'owner',
      get(row) {
        const email = row.owner && row.owner.email

        if (email) {
          return email.endsWith('@herokumanager.com') ? `${email.split('@')[0]} (team)` : email
        }
      },
    }
  }

  const sortByName = (a: AppWithPipelineCoupling, b: AppWithPipelineCoupling) => {
    const nameA = a.name || ''
    const nameB = b.name || ''
    if (nameA === nameB) return 0
    return nameA < nameB ? -1 : 1
  }

  const developmentApps = pipelineApps
    .filter(app => app.pipelineCoupling.stage === 'development')
    .sort(sortByName)
  const reviewApps = pipelineApps
    .filter(app => app.pipelineCoupling.stage === 'review')
    .sort(sortByName)
  const stagingApps = pipelineApps
    .filter(app => app.pipelineCoupling.stage === 'staging')
    .sort(sortByName)
  const productionApps = pipelineApps
    .filter(app => app.pipelineCoupling.stage === 'production')
    .sort(sortByName)
  const apps = developmentApps.concat(reviewApps).concat(stagingApps).concat(productionApps)

  hux.table(apps, columns)

  if (showOwnerWarning && pipeline.owner) {
    warnMixedOwnership(pipelineApps, pipeline, owner)
  }
}
