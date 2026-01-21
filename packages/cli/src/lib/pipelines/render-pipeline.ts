import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {AppWithPipelineCoupling} from '../api.js'
import {getOwner, warnMixedOwnership} from './ownership.js'

export default async function renderPipeline(
  heroku: APIClient,
  pipeline: Heroku.Pipeline,
  pipelineApps: Array<AppWithPipelineCoupling>,
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  {showOwnerWarning, withOwners} = {showOwnerWarning: false, withOwners: false}) {
  hux.styledHeader(color.pipeline(pipeline.name!))

  let owner

  if (pipeline.owner) {
    owner = await getOwner(heroku, pipelineApps, pipeline)
    ux.stdout(`owner: ${owner}`)
  }

  ux.stdout('')
  /* eslint-disable perfectionist/sort-objects */
  const columns: Parameters<typeof hux.table<AppWithPipelineCoupling>>[1] = {
    name: {
      get(row) {
        return color.app(row.name || '')
      },
      header: 'app name',
    },
    'coupling.stage': {
      get(row) {
        return row.pipelineCoupling.stage
      },
      header: 'stage',
    },
  }
  /* eslint-enable perfectionist/sort-objects */
  if (withOwners) {
    columns['owner.email'] = {
      get(row) {
        const email = row.owner && row.owner.email

        if (email) {
          return email.endsWith('@herokumanager.com') ? `${email.split('@')[0]} (team)` : email
        }
      },
      header: 'owner',
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
