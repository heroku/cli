import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {color} from '@heroku-cli/color'

export const printGroups = function (teams: Heroku.Team[], type: {label: string}) {
  const typeLabel = type.label ?? 'Team'
  teams = teams.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  hux.table(
    teams,
    {
      name: {
        get: ({name}: any): string => color.green(name),
        header: typeLabel,
      },
      role: {
        get: ({role}: any): string => role,
        header: 'Role',
      },
    },
  )
}

export const printGroupsJSON = function (teams: Heroku.Team[]) {
  ux.stdout(JSON.stringify(teams, null, 2))
}
