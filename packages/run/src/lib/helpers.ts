import {CliUx} from '@oclif/core'

export function buildCommand(args: Array<string>) {
  if (args.length === 1) {
    // do not add quotes around arguments if there is only one argument
    // `heroku run "rake test"` should work like `heroku run rake test`
    return args[0]
  }

  let cmd = ''
  for (let arg of args) {
    if (arg.includes(' ') || arg.includes('"')) {
      arg = '"' + arg.replace(/"/g, '\\"') + '"'
    }

    cmd = cmd + ' ' + arg
  }

  return cmd.trim()
}

export function buildEnvFromFlag(flag: string) {
  const env = {}
  for (const v of flag.split(';')) {
    const m = v.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (m) env[m[1]] = m[2]
    else CliUx.ux.warn(`env flag ${v} appears invalid. Avoid using ';' in values.`)
  }

  return env
}
