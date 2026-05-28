import type {App as BaseApp, TeamApp} from '@heroku/types/3.sdk'

export type App = BaseApp & Pick<TeamApp, 'locked' | 'joined'>
export type Apps = App[]
