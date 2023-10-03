import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'

export const getConfig = () => new Config({root: '../../package.json'})

export const getHerokuAPI = () => new APIClient(getConfig())
