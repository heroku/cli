export default function normalizeTableOutput(output: string): string {
  return output
    .toLowerCase()
    .split('\n')
    .map(line => line.replaceAll(/\s+/g, ' ').trim())
    .filter(line => line && !line.match(/^\s*(?:[─]+\s*)+$/))
    .join('\n')
}
