/* eslint-disable @typescript-eslint/ban-ts-comment */
import {ux} from '@oclif/core'
import type {APIClient} from '@heroku-cli/command'
import type {App} from '../types/fir'

// this function exists because oclif sorts argv
// and to capture all non-flag command inputs
export function revertSortedArgs(processArgs: Array<string>, argv: Array<string>) {
  const originalInputOrder = []
  const flagRegex = /^--?/
  let isSeparatorPresent = false
  let argIsFlag = false

  // this for-loop performs 2 tasks
  // 1. reorders the arguments in the order the user inputted
  // 2. checks that no oclif flags are included in originalInputOrder
  for (const processArg of processArgs) {
    argIsFlag = flagRegex.test(processArg)

    if (processArg === '--') {
      isSeparatorPresent = true
    }

    if ((argv.includes(processArg) && (!isSeparatorPresent && !argIsFlag)) ||
        (argv.includes(processArg) && (isSeparatorPresent))) {
      originalInputOrder.push(processArg)
    }
  }

  return originalInputOrder
}

export function buildCommand(args: Array<string>, prependLauncher: boolean = false) {
  const prependText = prependLauncher ? 'launcher ' : ''

  if (args.length === 1) {
    // do not add quotes around arguments if there is only one argument
    // `heroku run "rake test"` should work like `heroku run rake test`
    return `${prependText}${args[0]}`
  }

  let cmd = ''
  for (let arg of args) {
    if (arg.includes(' ') || arg.includes('"')) {
      arg = '"' + arg.replace(/"/g, '\\"') + '"'
    }

    cmd = cmd + ' ' + arg
  }

  return `${prependText}${cmd.trim()}`
}

export function buildEnvFromFlag(flag: string) {
  const env = {}
  for (const v of flag.split(';')) {
    const m = v.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    // @ts-ignore
    if (m) env[m[1]] = m[2]
    else ux.warn(`env flag ${v} appears invalid. Avoid using ';' in values.`)
  }

  return env
}

/**
 * Determines whether to prepend `launcher` to the command for a given app.
 * Behavior: Only prepend on CNB stack apps and when not explicitly disabled.
 */
export async function shouldPrependLauncher(heroku: APIClient, appName: string, disableLauncher: boolean): Promise<boolean> {
  if (disableLauncher) return false

  const {body: app} = await heroku.get<App>(`/apps/${appName}` , {
    headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
  })

  return (app.stack && app.stack.name) === 'cnb'
}

/**
 * Builds the command string, automatically deciding whether to prepend `launcher`.
 */
export async function buildCommandWithLauncher(
  heroku: APIClient,
  appName: string,
  args: string[],
  disableLauncher: boolean,
): Promise<string> {
  const prependLauncher = await shouldPrependLauncher(heroku, appName, disableLauncher)
  return buildCommand(args, prependLauncher)
}
