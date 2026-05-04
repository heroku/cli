import * as color from '@heroku/heroku-cli-util/color'
import fs from 'node:fs'

export function validateEnvFile(envFile: string | undefined, warn: (message: string) => void): string {
  const resolvedEnvFile = envFile || '.env'

  if (fs.existsSync(resolvedEnvFile) && !fs.statSync(resolvedEnvFile).isFile()) {
    warn(`The specified location for the env file, ${color.label(resolvedEnvFile)}, is not a file, ignoring.`)
    return ''
  }

  return resolvedEnvFile
}
