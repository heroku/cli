import * as fs from 'fs'
import {color} from '@heroku-cli/color'

export function validateEnvFile(envFile: string | undefined, warn: (message: string) => void): string {
  const resolvedEnvFile = envFile || '.env'
  
  if (fs.existsSync(resolvedEnvFile) && !fs.statSync(resolvedEnvFile).isFile()) {
    warn(`The specified location for the env file, ${color.bold(resolvedEnvFile)}, is not a file, ignoring.`)
    return ''
  }
  
  return resolvedEnvFile
}
