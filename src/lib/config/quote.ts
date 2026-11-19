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
    return "'" + s + "'"
  }

  return s
}

export function parse(a: string): string {
  if (a.startsWith('"')) {
    // Undo quote's escapes in one pass, left to right, so an escaped backslash (\\) is taken whole and its
    // second half never starts a \n. shell-quote unescapes the backslashes, quotes and dollar signs left, but
    // not the backticks and exclamation marks quote escapes too.
    const unescaped: Record<string, string> = {'!': '!', '`': '`', n: '\n'}
    a = a.replaceAll(/\\([\\n`!])/g, (escape, c: string) => unescaped[c] ?? escape)
  } else if (a.startsWith("'")) {
    // single-quoted strings are literal in POSIX sh — no unescaping needed
  }

  const parsed = shell.parse(a)
  if (parsed.length > 1) throw new Error(`Invalid token: ${a}`)
  if (parsed.length === 0) return ''
  const result = parsed[0]
  if (typeof result !== 'string') throw new Error(`Invalid token: ${a}`)
  return result
}
