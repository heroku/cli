import {color} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'

export const COLORS: Array<(s: string) => string> = [
  s => color.yellow(s),
  s => color.green(s),
  s => color.cyan(s),
  s => color.magenta(s),
  s => color.blue(s),
  s => color.bold.green(s),
  s => color.bold.cyan(s),
  s => color.bold.magenta(s),
  s => color.bold.yellow(s),
  s => color.bold.blue(s),
]
const assignedColors: any = {}
function getColorForIdentifier(i: string) {
  i = i.split('.')[0]
  if (assignedColors[i]) return assignedColors[i]
  assignedColors[i] = COLORS[Object.keys(assignedColors).length % COLORS.length]
  return assignedColors[i]
}

// get initial colors so they are the same every time
getColorForIdentifier('run')
getColorForIdentifier('router')
getColorForIdentifier('web')
getColorForIdentifier('postgres')
getColorForIdentifier('heroku-postgres')

const lineRegex = /^(.*?\[([\w-]+)([\d.]+)?]:)(.*)?$/

const dim = (i: string) => color.dim(i)
const other = dim
const path = (i: string) => color.green(i)
const method = (i: string) => color.magenta(i)
const status = (code: any) => {
  if (code < 200) return code
  if (code < 300) return color.success(code)
  if (code < 400) return color.info(code)
  if (code < 500) return color.warning(code)
  if (code < 600) return color.failure(code)
  return code
}

const ms = (s: string) => {
  const ms = Number.parseInt(s, 10)
  if (!ms) return s
  if (ms < 100) return color.greenBright(s)
  if (ms < 500) return color.success(s)
  if (ms < 5000) return color.warning(s)
  if (ms < 10000) return color.yellowBright(s)
  return color.failure(s)
}

function colorizeRouter(body: string) {
  const encodeColor = ([k, v]: [string, string]) => {
    switch (k) {
    case 'at': {
      return [k, v === 'error' ? color.failure(v) : other(v)]
    }

    case 'code': {
      return [k, color.failure(color.label(v))]
    }

    case 'method': {
      return [k, method(v)]
    }

    case 'dyno': {
      return [k, getColorForIdentifier(v)(v)]
    }

    case 'status': {
      return [k, status(v)]
    }

    case 'path': {
      return [k, path(v)]
    }

    case 'connect': {
      return [k, ms(v)]
    }

    case 'service': {
      return [k, ms(v)]
    }

    default: {
      return [k, other(v)]
    }
    }
  }

  try {
    const tokens = body.split(/\s+/).map(sub => {
      const parts = sub.split('=')
      if (parts.length === 1) {
        return parts
      }

      if (parts.length === 2) {
        return encodeColor(parts as [string, string])
      }

      return encodeColor([parts[0], parts.splice(1).join('=')])
    })

    return tokens.map(([k, v]) => {
      if (v === undefined) {
        return other(k)
      }

      return other(k + '=') + v
    }).join(' ')
  } catch (error: any) {
    ux.warn(error)
    return body
  }
}

const state = (s: string) => {
  switch (s) {
  case 'down': {
    return color.failure(s)
  }

  case 'up': {
    return color.success(s)
  }

  case 'starting': {
    return color.yellowBright(s)
  }

  case 'complete': {
    return color.success(s)
  }

  default: {
    return s
  }
  }
}

function colorizeRun(body: string) {
  try {
    if (body.match(/^Stopping all processes with SIGTERM$/)) return color.failure(body)
    const starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/)
    if (starting) {
      return [
        starting[1],
        color.code(starting[2]),
        starting[3] || '',
        color.green(starting[4] || ''),
      ].join('')
    }

    const stateChange = body.match(/^(State changed from )(\w+)( to )(\w+)$/)
    if (stateChange) {
      return [
        stateChange[1],
        state(stateChange[2]),
        stateChange[3] || '',
        state(stateChange[4] || ''),
      ].join('')
    }

    const exited = body.match(/^(Process exited with status )(\d+)$/)
    if (exited) {
      return [
        exited[1],
        exited[2] === '0' ? color.success(exited[2]) : color.failure(exited[2]),
      ].join('')
    }
  } catch (error: any) {
    ux.warn(error)
  }

  return body
}

function colorizeWeb(body: string) {
  try {
    if (body.match(/^Unidling$/)) return color.yellow(body)
    if (body.match(/^Restarting$/)) return color.yellow(body)
    if (body.match(/^Stopping all processes with SIGTERM$/)) return color.failure(body)
    const starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/)
    if (starting) {
      return [
        (starting[1]),
        color.code(starting[2]),
        (starting[3] || ''),
        color.green(starting[4] || ''),
      ].join('')
    }

    const exited = body.match(/^(Process exited with status )(\d+)$/)
    if (exited) {
      return [
        exited[1],
        exited[2] === '0' ? color.success(exited[2]) : color.failure(exited[2]),
      ].join('')
    }

    const stateChange = body.match(/^(State changed from )(\w+)( to )(\w+)$/)
    if (stateChange) {
      return [
        stateChange[1],
        state(stateChange[2]),
        stateChange[3],
        state(stateChange[4]),
      ].join('')
    }

    const apache = body.match(/^(\d+\.\d+\.\d+\.\d+ -[^-]*- \[[^\]]+] ")(\w+)( )([^ ]+)( HTTP\/\d+\.\d+" )(\d+)( .+$)/)
    if (apache) {
      const [, ...tokens] = apache
      return [
        other(tokens[0]),
        method(tokens[1]),
        other(tokens[2]),
        path(tokens[3]),
        other(tokens[4]),
        status(tokens[5]),
        other(tokens[6]),
      ].join('')
    }

    const route = body.match(/^(.* ")(\w+)(.+)(HTTP\/\d+\.\d+" .*)$/)
    if (route) {
      return [
        route[1],
        method(route[2]),
        path(route[3]),
        route[4],
      ].join('')
    }
  } catch (error: any) {
    ux.warn(error)
  }

  return body
}

function colorizeAPI(body: string) {
  if (body.match(/^Build succeeded$/)) return color.success(body)
  if (body.match(/^Build failed/)) return color.failure(body)
  const build = body.match(/^(Build started by user )(.+)$/)
  if (build) {
    return [
      build[1],
      color.green(build[2]),
    ].join('')
  }

  const deploy = body.match(/^(Deploy )([\w]+)( by user )(.+)$/)
  if (deploy) {
    return [
      deploy[1],
      color.cyan(deploy[2]),
      deploy[3],
      color.green(deploy[4]),
    ].join('')
  }

  const release = body.match(/^(Release )(v[\d]+)( created by user )(.+)$/)
  if (release) {
    return [
      release[1],
      color.magenta(release[2]),
      release[3],
      color.green(release[4]),
    ].join('')
  }

  const starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/)
  if (starting) {
    return [
      (starting[1]),
      color.code(starting[2]),
      (starting[3] || ''),
      color.green(starting[4] || ''),
    ].join('')
  }

  return body
}

function colorizeRedis(body: string) {
  if (body.match(/source=\w+ sample#/)) {
    body = dim(body)
  }

  return body
}

function colorizePG(body: string) {
  const create = body.match(/^(\[DATABASE].*)(CREATE TABLE)(.*)$/)
  if (create) {
    return [
      other(create[1]),
      color.magenta(create[2]),
      color.cyan(create[3]),
    ].join('')
  }

  if (body.match(/source=\w+ sample#/)) {
    body = dim(body)
  }

  return body
}

export default function colorize(line: string) {
  if (process.env.HEROKU_LOGS_COLOR === '0' || process.env.HEROKU_COLOR === '0')
    return line

  const parsed = line.match(lineRegex)
  if (!parsed) return line
  const header = parsed[1]
  const identifier = parsed[2]
  let body = (parsed[4] || '').trim()
  switch (identifier) {
  case 'api': {
    body = colorizeAPI(body)
    break
  }

  case 'router': {
    body = colorizeRouter(body)
    break
  }

  case 'run': {
    body = colorizeRun(body)
    break
  }

  case 'web': {
    body = colorizeWeb(body)
    break
  }

  case 'heroku-redis': {
    body = colorizeRedis(body)
    break
  }

  case 'heroku-postgres':
  case 'postgres': {
    body = colorizePG(body)
    break
  }
  }

  return getColorForIdentifier(identifier)(header) + ' ' + body
}
