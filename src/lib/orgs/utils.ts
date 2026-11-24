import type {Team} from '@heroku/types/3.sdk'

import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

export const printGroups = function (teams: Team[], type: {label: string}) {
  const typeLabel = type.label ?? 'Team'
  teams = [...teams].sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  ux.stdout(hux.table(
    teams,
    {
      name: {
        get: ({name}: any): string => color.team(name),
        header: typeLabel,
      },
      role: {
        get: ({role}: any): string => role,
        header: 'Role',
      },
    },
  ))
}

export const printGroupsJSON = function (teams: Team[]) {
  ux.stdout(JSON.stringify(teams, null, 2))
}
