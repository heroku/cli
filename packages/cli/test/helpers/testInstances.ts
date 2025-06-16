import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'

const pjsonPath = require.resolve('../../package.json')
let conf: Config
export const getConfig = async () => {
  if (!conf) {
    conf = new Config({root: pjsonPath})
    await conf.load()
  }

  return conf
}

export const getHerokuAPI = async () => {
  const conf = await getConfig()
  return new APIClient(conf)
}
