/*
import {ux} from '@oclif/core'
import {SpawnOptions} from 'child_process'
import debug from 'debug'
import * as fs from 'fs'
import * as path from 'node:path'
import {ConnectionDetails, utils} from '@heroku/heroku-cli-util'

export async function fetchVersion(db: ConnectionDetails) {
  const psqlService = new utils.pg.PsqlService(db)
  const output = await psqlService.execQuery('SHOW server_version', ['-X', '-q'])
  return output.match(/[0-9]{1,}\.[0-9]{1,}/)?.[0]
}

const pgDebug = debug('pg')

export function psqlFileOptions(file: string, dbEnv: NodeJS.ProcessEnv) {
  pgDebug('Running sql file: %s', file.trim())

  const childProcessOptions:SpawnOptions = {
    stdio: ['ignore', 'pipe', 'inherit'],
  }

  const psqlArgs = ['-f', file, '--set', 'sslmode=require']

  return {
    dbEnv,
    psqlArgs,
    childProcessOptions,
  }
}

export function psqlInteractiveOptions(prompt: string, dbEnv: NodeJS.ProcessEnv) {
  let psqlArgs = ['--set', `PROMPT1=${prompt}`, '--set', `PROMPT2=${prompt}`]
  const psqlHistoryPath = process.env.HEROKU_PSQL_HISTORY
  if (psqlHistoryPath) {
    if (fs.existsSync(psqlHistoryPath) && fs.statSync(psqlHistoryPath).isDirectory()) {
      const appLogFile = `${psqlHistoryPath}/${prompt.split(':')[0]}`
      pgDebug('Logging psql history to %s', appLogFile)
      psqlArgs = psqlArgs.concat(['--set', `HISTFILE=${appLogFile}`])
    } else if (fs.existsSync(path.dirname(psqlHistoryPath))) {
      pgDebug('Logging psql history to %s', psqlHistoryPath)
      psqlArgs = psqlArgs.concat(['--set', `HISTFILE=${psqlHistoryPath}`])
    } else {
      ux.warn(`HEROKU_PSQL_HISTORY is set but is not a valid path (${psqlHistoryPath})`)
    }
  }

  psqlArgs = psqlArgs.concat(['--set', 'sslmode=require'])

  const childProcessOptions: SpawnOptions = {
    stdio: 'inherit',
  }

  return {
    dbEnv,
    psqlArgs,
    childProcessOptions,
  }
}

export async function execFile(db: ConnectionDetails, file: string) {
  const psqlService = new utils.pg.PsqlService(db)
  const configs = utils.pg.psql.getPsqlConfigs(db)
  const options = psqlFileOptions(file, configs.dbEnv)

  return psqlService.runWithTunnel(configs.dbTunnelConfig, options)
}

export async function interactive(db: ConnectionDetails) {
  const psqlService = new utils.pg.PsqlService(db)
  const attachmentName = db.attachment!.name
  const prompt = `${db.attachment!.app.name}::${attachmentName}%R%# `
  const configs = utils.pg.psql.getPsqlConfigs(db)
  configs.dbEnv.PGAPPNAME = 'psql interactive' // default was 'psql non-interactive`
  const options = psqlInteractiveOptions(prompt, configs.dbEnv)

  return psqlService.runWithTunnel(configs.dbTunnelConfig, options)
}
*/
