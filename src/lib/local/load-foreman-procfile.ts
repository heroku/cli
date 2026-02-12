import fs from 'fs'

function parseProcfile(content: string): Record<string, string> {
  const lines = content.split(/\r?\n/).filter((line, i) => {
    if (line.match(/\w/)) {
      if (!line.match(/^\s*\w+:/)) {
        throw new Error('line ' + (i + 1) + ' parse error: ' + line)
      }
    }

    return line.match(/\w/)
  })

  const ret: Record<string, string> = {}

  lines.forEach(line => {
    const parts = line.split(':')
    const key = parts.shift()!.replace(/\s*$/, '')
    ret[key] = parts.join(':').replace(/^\s*/, '')
  })

  return ret
}

export const loadProc = (procfilePath: string) => {
  const content = fs.readFileSync(procfilePath, 'utf8')
  return parseProcfile(content)
}
