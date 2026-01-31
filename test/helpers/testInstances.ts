import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

let conf: Config

export const getConfig = async () => {
  if (!conf) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const root = path.resolve(__dirname, '../..')
    conf = new Config({
      root,
    })
    await conf.load()
  }

  return conf
}

export const getHerokuAPI = async () => {
  const conf = await getConfig()
  return new APIClient(conf)
}
