import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

export const getConfig = async () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const pjsonPath = path.resolve(__dirname, '../../package.json')
  const conf = new Config({root: pjsonPath})
  await conf.load()
  return conf
}

export const getHerokuAPI = async () => {
  const conf = await getConfig()
  return new APIClient(conf)
}
