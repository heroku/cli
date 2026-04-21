import shell from 'shell-quote'

// slightly modified form of shell-quote to default to using single-quotes over backslashes
export function quote(s: string): string {
  // eslint-disable-next-line no-useless-escape
  if (/["\s#!$&'()*,:;<=>?@\[\\\]^`{|}]/.test(s)) {
    if (/['\n]/.test(s)) return '"'
      + s
        .replaceAll(/(["\\$`!])/g, String.raw`\$1`)
        .replaceAll('\n', String.raw`\n`)
      + '"'
    return "'" + s.replaceAll(/(['\\])/g, String.raw`\$1`) + "'"
  }

  return s
}

export function parse(a: string): string {
  if (a.startsWith('"')) {
    a = a.replaceAll(String.raw`\n`, '\n')
  } else if (a.startsWith("'")) {
    a = a.replaceAll('\\\\', '\\')
  }

  const parsed = shell.parse(a)
  if (parsed.length > 1) throw new Error(`Invalid token: ${a}`)
  if (parsed.length === 0) return ''
  const result = parsed[0]
  if (typeof result !== 'string') throw new Error(`Invalid token: ${a}`)
  return result
}
