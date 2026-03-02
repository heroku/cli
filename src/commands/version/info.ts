import {Args, Command, ux} from '@oclif/core'
import {color} from '@heroku/heroku-cli-util'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

export default class VersionInfo extends Command {
  static args = {
    version: Args.string({
      description: 'version number to look up (e.g., 11.0.0, 10.17.0)',
      required: false,
    }),
  }

  static description = 'display changelog information for a specific CLI version'

  static examples = [
    `${color.command('<%= config.bin %> <%= command.id %>')}`,
    `${color.command('<%= config.bin %> <%= command.id %> 11.0.0')}`,
  ]

  async run() {
    const {args} = await this.parse(VersionInfo)
    const {version} = args

    try {
      // Find the CHANGELOG.md file relative to the CLI installation
      const __dirname = fileURLToPath(new URL('.', import.meta.url))
      const changelogPath = join(__dirname, '..', '..', '..', 'CHANGELOG.md')
      const changelogContent = await readFile(changelogPath, 'utf8')

      // Get the version entry
      const entry = version
        ? this.extractVersionEntry(changelogContent, version)
        : this.extractMostRecentEntry(changelogContent)

      if (!entry) {
        const msg = version ? `Version ${version} not found in CHANGELOG.md` : 'No version entries found in CHANGELOG.md'
        ux.error(msg, {exit: 1})
      }

      // Display content based on what's available
      const summary = this.extractSection(entry, 'Summary')
      if (summary) {
        ux.stdout(this.stripMarkdown(summary))
      } else {
        const bugsAndFeatures = this.extractSections(entry, ['Bug Fixes', 'Features'])
        if (bugsAndFeatures) {
          ux.stdout(this.stripMarkdown(bugsAndFeatures))
        } else {
          ux.stdout(this.stripMarkdown(this.extractHeader(entry)))
          ux.stdout('')
          ux.stdout('- Miscellaneous improvements')
        }
      }

      ux.stdout('')
      ux.stdout('* For the full changelog, visit: https://github.com/heroku/cli/blob/main/CHANGELOG.md')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        ux.error('CHANGELOG.md not found', {exit: 1})
      }

      throw error
    }
  }

  private extractEntry(changelog: string, predicate: (versionInHeader: string) => boolean): null | string {
    const lines = changelog.split('\n')
    let startIndex = -1

    // Find the start of the entry
    for (const [i, line] of lines.entries()) {
      const match = line.match(/^##? \[([^\]]+)\]/)
      if (match && predicate(match[1])) {
        startIndex = i
        break
      }
    }

    if (startIndex === -1) return null

    // Find the end of the entry (next version or end of file)
    const endIndex = lines.slice(startIndex + 1).findIndex(line => line.match(/^##? \[/))
    const end = endIndex === -1 ? lines.length : startIndex + 1 + endIndex

    return lines.slice(startIndex, end).join('\n').trim()
  }

  private extractHeader(entry: string): string {
    return entry.split('\n').find(line => line.trim()) || entry.split('\n')[0]
  }

  private extractMostRecentEntry(changelog: string): null | string {
    return this.extractEntry(changelog, () => true) // First match is most recent
  }

  private extractSection(entry: string, sectionName: string): null | string {
    return this.extractSections(entry, [sectionName])
  }

  private extractSections(entry: string, sectionNames: string[]): null | string {
    const lines = entry.split('\n')
    const header = this.extractHeader(entry)
    const sections: string[] = []
    let currentSection: null | string = null
    let currentContent: string[] = []

    for (const line of lines) {
      const headerMatch = line.match(/^###\s+(.+)$/)
      if (headerMatch) {
        // Save previous section if it matches our target sections
        if (currentSection && sectionNames.includes(currentSection)) {
          sections.push(`### ${currentSection}\n${currentContent.join('\n')}`)
        }

        currentSection = headerMatch[1]
        currentContent = []
      } else if (currentSection) {
        currentContent.push(line)
      }
    }

    // Save last section if it matches
    if (currentSection && sectionNames.includes(currentSection)) {
      sections.push(`### ${currentSection}\n${currentContent.join('\n')}`)
    }

    return sections.length > 0 ? `${header}\n\n${sections.join('\n\n').trim()}` : null
  }

  private extractVersionEntry(changelog: string, version: string): null | string {
    const versionWithoutV = version.startsWith('v') ? version.slice(1) : version
    return this.extractEntry(changelog, v => v === versionWithoutV || v === `v${versionWithoutV}`)
  }

  private stripMarkdown(text: string): string {
    return text
      .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links: [text](url) -> text
      .replaceAll(/\*\*([^*]+)\*\*/g, '$1')       // Bold: **text** -> text
      .replaceAll(/\*([^*]+)\*/g, '$1')           // Italic: *text* -> text
      .replaceAll(/`([^`]+)`/g, '$1')             // Code: `code` -> code
      .replaceAll(/^#+\s+/gm, '=== ')             // Headers: ### -> ===
      .replaceAll(/\*/g, '')                      // Remaining asterisks
  }
}
