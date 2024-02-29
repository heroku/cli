import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {exit} from './error'
import {ParserOutput} from '@oclif/core/lib/interfaces/parser'
import Create from '../../commands/apps/create'

export const getTeamInfo = async function (team: string | undefined, heroku: APIClient) {
  const teamName = team || ''
  if (!teamName) exit(1, 'No team or org specified.\nRun this command with --team')
  return heroku.get<Heroku.Team>(`/teams/${teamName}`)
}
