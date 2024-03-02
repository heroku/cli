import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import * as _ from 'lodash'
import color from '@heroku-cli/color'

export const printGroups = function (teams: Heroku.Team[], type: {label: string}) {
  const typeLabel = type.label ? type.label : 'Team'
  teams = _.sortBy(teams, 'name')

  ux.table(
    teams,
    {
      name: {
        header: typeLabel,
        get: ({name}: any): string => color.green(name),
      },
      role: {
        get: ({role}: any): string => role,
      },
    },
  )
}

export const printGroupsJSON = function (teams: Heroku.Team[]) {
  ux.log(JSON.stringify(teams, null, 2))
}
