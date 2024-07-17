import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'

export const getConfig = async () => {
  const pjsonPath = require.resolve('../../package.json')
  const conf = new Config({root: pjsonPath})
  await conf.load()
  return conf
}

export const getHerokuAPI = async () => {
  const conf = await getConfig()
  return new APIClient(conf)
}
