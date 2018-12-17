const {default: ux} = require('cli-ux')
const {default: c} = require('@heroku-cli/color')

const COLORS = [
  s => c.yellow(s),
  s => c.green(s),
  s => c.cyan(s),
  s => c.magenta(s),
  s => c.blue(s),
  s => c.bold.green(s),
  s => c.bold.cyan(s),
  s => c.bold.magenta(s),
  s => c.bold.yellow(s),
  s => c.bold.blue(s)
]
const assignedColors = {}
function getColorForIdentifier (i) {
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

let lineRegex = /^(.*?\[([\w-]+)([\d.]+)?]:)(.*)?$/

const red = c.red
const dim = i => c.dim(i)
const other = dim
const path = i => c.blue(i)
const method = i => c.bold.magenta(i)
const status = code => {
  if (code < 200) return code
  if (code < 300) return c.green(code)
  if (code < 400) return c.cyan(code)
  if (code < 500) return c.yellow(code)
  if (code < 600) return c.red(code)
  return code
}
const ms = s => {
  const ms = parseInt(s)
  if (!ms) return s
  if (ms < 100) return c.greenBright(s)
  if (ms < 500) return c.green(s)
  if (ms < 5000) return c.yellow(s)
  if (ms < 10000) return c.yellowBright(s)
  return c.red(s)
}

function colorizeRouter (body) {
  const encodeColor = ([k, v]) => {
    switch (k) {
      case 'at': return [k, v === 'error' ? red(v) : other(v)]
      case 'code': return [k, red.bold(v)]
      case 'method': return [k, method(v)]
      case 'dyno': return [k, getColorForIdentifier(v)(v)]
      case 'status': return [k, status(v)]
      case 'path': return [k, path(v)]
      case 'connect': return [k, ms(v)]
      case 'service': return [k, ms(v)]
      default: return [k, other(v)]
    }
  }

  try {
    const tokens = body.split(/\s+/).map((sub) => {
      const parts = sub.split('=')
      if (parts.length === 1) {
        return parts
      } else if (parts.length === 2) {
        return encodeColor(parts)
      } else {
        return encodeColor([parts[0], parts.splice(1).join()])
      }
    })

    return tokens.map(([k, v]) => {
      if (v === undefined) {
        return other(k)
      }
      return other(k + '=') + v
    }).join(' ')
  } catch (err) {
    ux.warn(err)
    return body
  }
}

const state = s => {
  switch (s) {
    case 'down': return red(s)
    case 'up': return c.greenBright(s)
    case 'starting': return c.yellowBright(s)
    case 'complete': return c.greenBright(s)
    default: return s
  }
}

function colorizeRun (body) {
  try {
    if (body.match(/^Stopping all processes with SIGTERM$/)) return c.red(body)
    let starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/)
    if (starting) {
      return [
        starting[1],
        c.cmd(starting[2]),
        starting[3] || '',
        c.green(starting[4] || '')
      ].join('')
    }
    let stateChange = body.match(/^(State changed from )(\w+)( to )(\w+)$/)
    if (stateChange) {
      return [
        stateChange[1],
        state(stateChange[2]),
        stateChange[3] || '',
        state(stateChange[4] || '')
      ].join('')
    }
    let exited = body.match(/^(Process exited with status )(\d+)$/)
    if (exited) {
      return [
        exited[1],
        exited[2] === '0' ? c.greenBright(exited[2]) : c.red(exited[2])
      ].join('')
    }
  } catch (err) {
    ux.warn(err)
  }
  return body
}

function colorizeWeb (body) {
  try {
    if (body.match(/^Unidling$/)) return c.yellow(body)
    if (body.match(/^Restarting$/)) return c.yellow(body)
    if (body.match(/^Stopping all processes with SIGTERM$/)) return c.red(body)
    let starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/)
    if (starting) {
      return [
        (starting[1]),
        c.cmd(starting[2]),
        (starting[3] || ''),
        c.green(starting[4] || '')
      ].join('')
    }
    let exited = body.match(/^(Process exited with status )(\d+)$/)
    if (exited) {
      return [
        exited[1],
        exited[2] === '0' ? c.greenBright(exited[2]) : c.red(exited[2])
      ].join('')
    }
    let stateChange = body.match(/^(State changed from )(\w+)( to )(\w+)$/)
    if (stateChange) {
      return [
        stateChange[1],
        state(stateChange[2]),
        stateChange[3],
        state(stateChange[4])
      ].join('')
    }
    let apache = body.match(/^(\d+\.\d+\.\d+\.\d+ -[^-]*- \[[^\]]+] ")(\w+)( )([^ ]+)( HTTP\/\d+\.\d+" )(\d+)( .+$)/)
    if (apache) {
      const [, ...tokens] = apache
      return [
        other(tokens[0]),
        method(tokens[1]),
        other(tokens[2]),
        path(tokens[3]),
        other(tokens[4]),
        status(tokens[5]),
        other(tokens[6])
      ].join('')
    }
    let route = body.match(/^(.* ")(\w+)(.+)(HTTP\/\d+\.\d+" .*)$/)
    if (route) {
      return [
        route[1],
        method(route[2]),
        path(route[3]),
        route[4]
      ].join('')
    }
  } catch (err) {
    ux.warn(err)
  }
  return body
}

function colorizeAPI (body) {
  if (body.match(/^Build succeeded$/)) return c.greenBright(body)
  if (body.match(/^Build failed/)) return c.red(body)
  const build = body.match(/^(Build started by user )(.+)$/)
  if (build) {
    return [
      build[1],
      c.green(build[2])
    ].join('')
  }
  const deploy = body.match(/^(Deploy )([\w]+)( by user )(.+)$/)
  if (deploy) {
    return [
      deploy[1],
      c.cyan(deploy[2]),
      deploy[3],
      c.green(deploy[4])
    ].join('')
  }
  const release = body.match(/^(Release )(v[\d]+)( created by user )(.+)$/)
  if (release) {
    return [
      release[1],
      c.magenta(release[2]),
      release[3],
      c.green(release[4])
    ].join('')
  }
  let starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/)
  if (starting) {
    return [
      (starting[1]),
      c.cmd(starting[2]),
      (starting[3] || ''),
      c.green(starting[4] || '')
    ].join('')
  }
  return body
}

function colorizeRedis (body) {
  if (body.match(/source=\w+ sample#/)) {
    body = dim(body)
  }
  return body
}

function colorizePG (body) {
  let create = body.match(/^(\[DATABASE].*)(CREATE TABLE)(.*)$/)
  if (create) {
    return [
      other(create[1]),
      c.magenta(create[2]),
      c.cyan(create[3])
    ].join('')
  }
  if (body.match(/source=\w+ sample#/)) {
    body = dim(body)
  }
  return body
}

module.exports = function colorize (line) {
  if (process.env.HEROKU_LOGS_COLOR === '0') return line

  let parsed = line.match(lineRegex)
  if (!parsed) return line
  let header = parsed[1]
  let identifier = parsed[2]
  let body = (parsed[4] || '').trim()
  switch (identifier) {
    case 'api':
      body = colorizeAPI(body)
      break
    case 'router':
      body = colorizeRouter(body)
      break
    case 'run':
      body = colorizeRun(body)
      break
    case 'web':
      body = colorizeWeb(body)
      break
    case 'heroku-redis':
      body = colorizeRedis(body)
      break
    case 'heroku-postgres':
    case 'postgres':
      body = colorizePG(body)
  }
  return getColorForIdentifier(identifier)(header) + ' ' + body
}

module.exports.COLORS = COLORS
