
import ansis from 'ansis'

export default function normalizeTableOutput(output: string): string {
  return ansis.strip(output)
    .normalize('NFKC')
    .toLowerCase()
    .split('\n')
    .map(line => line.replaceAll(/\s+/g, ' ').trim())

    // Note, there are 2 types of dashes in this regex: one from
    // the US keyboard of a Mac, and the other from the oclif/table
    // repo for the table layout we're using.
    .filter(line => line && !line.match(/^\s*(?:[-─]+\s*)+$/))
    .join('\n')
}
