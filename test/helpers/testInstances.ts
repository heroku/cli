import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {Interfaces} from '@oclif/core'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

let conf: Config

export const getConfig = async (loadOpts?: Interfaces.LoadOptions) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const defaultRoot = path.resolve(__dirname, '../..')

  // If loadOpts are provided, create a new Config instance
  if (loadOpts) {
    const newConf = await Config.load(loadOpts)
    return newConf
  }

  // Otherwise use the cached config
  if (!conf) {
    conf = new Config({
      root: defaultRoot,
    })
    await conf.load()
  }

  return conf
}

export const getHerokuAPI = async () => {
  const conf = await getConfig()
  return new APIClient(conf)
}
