// @ts-expect-error - parse-procfile lacks TypeScript definitions
import parseProcfile from 'parse-procfile'
import fs from 'fs'

export const loadProc = (procfilePath: string) => {
  const content = fs.readFileSync(procfilePath, 'utf8')
  return parseProcfile(content)
}
