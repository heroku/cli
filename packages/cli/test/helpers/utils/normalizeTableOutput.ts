import stripAnsi from 'strip-ansi'

export default function normalizeTableOutput(output: string): string {
  return stripAnsi(output)
    .normalize('NFC')
    .toLowerCase()
    .split('\n')
    .map(line => line.replaceAll(/\s+/g, ' ').trim())
    .filter(line => line && !line.match(/^\s*(?:[─]+\s*)+$/))
    .join('\n')
}
