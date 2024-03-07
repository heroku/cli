
const shell = require('shell-quote')

// slightly modified form of shell-quote to default to using single-quotes over backslashes
export function quote(s: string): string {
  // eslint-disable-next-line no-useless-escape
  if (/["\s#!$&'()*,:;<=>?@\[\\\]^`{|}]/.test(s)) {
    if (/['\n]/.test(s)) return '"' +
      s
        .replace(/(["\\$`!])/g, '\\$1')
        .replace(/\n/g, '\\n') +
      '"'
    return "'" + s.replace(/(['\\])/g, '\\$1') + "'"
  }

  return s
}

export function parse(a: string): string {
  if (a.startsWith('"')) {
    a = a.replace(/\\n/g, '\n')
  } else if (a.startsWith("'")) {
    a = a.replace(/\\\\/g, '\\')
  }

  const parsed = shell.parse(a)
  if (parsed.length > 1) throw new Error(`Invalid token: ${a}`)
  return parsed[0]
  // return parsed[0].replace(/\\\\n/g, '\n')
}
