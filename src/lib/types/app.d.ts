import type {App as BaseApp, TeamApp} from '@heroku/types/3.sdk'

export type App = BaseApp & Pick<TeamApp, 'locked' | 'joined'>
export type Apps = App[]

export type ExtendedApp = App & {
  create_status?: string
  cron_finished_at?: null | string
  cron_next_run?: null | string
  database_size?: null | number
  extended?: unknown
}
