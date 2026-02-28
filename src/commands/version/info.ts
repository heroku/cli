import {Args, Command, ux} from '@oclif/core'
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
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> 11.0.0',
    '<%= config.bin %> <%= command.id %> 10.17.0',
  ]

  async run() {
    const {args} = await this.parse(VersionInfo)
    const {version} = args

    try {
      // Find the CHANGELOG.md file relative to the CLI installation
      const __dirname = fileURLToPath(new URL('.', import.meta.url))
      const changelogPath = join(__dirname, '..', '..', '..', 'CHANGELOG.md')

      const changelogContent = await readFile(changelogPath, 'utf8')

      let entry: string | null

      if (version) {
        // Extract the entry for the specified version
        entry = this.extractVersionEntry(changelogContent, version)

        if (!entry) {
          ux.error(`Version ${version} not found in CHANGELOG.md`, {exit: 1})
        }
      } else {
        // If no version specified, get the most recent entry
        entry = this.extractMostRecentEntry(changelogContent)

        if (!entry) {
          ux.error('No version entries found in CHANGELOG.md', {exit: 1})
        }
      }

      // If the entry has a Summary section as the first content, only show that
      const summaryOnly = this.extractSummaryIfFirst(entry)
      if (summaryOnly) {
        ux.stdout(summaryOnly)
        ux.stdout('')
        ux.stdout('For the full changelog, visit: https://github.com/heroku/cli/blob/main/CHANGELOG.md')
      } else {
        ux.stdout(entry)
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        ux.error('CHANGELOG.md not found', {exit: 1})
      }

      throw error
    }
  }

  private extractSummaryIfFirst(entry: string): string | null {
    const lines = entry.split('\n')
    let summaryStartIndex = -1
    let summaryEndIndex = -1

    // Find if "### Summary" appears early in the entry (within first few lines after header)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].trim() === '### Summary') {
        summaryStartIndex = i
        break
      }
    }

    if (summaryStartIndex === -1) {
      return null
    }

    // Find the end of the summary section (next ### header or end of entry)
    for (let i = summaryStartIndex + 1; i < lines.length; i++) {
      if (lines[i].match(/^###\s+/)) {
        summaryEndIndex = i
        break
      }
    }

    if (summaryEndIndex === -1) {
      // Summary goes to the end
      summaryEndIndex = lines.length
    }

    // Extract header + summary section
    const header = lines.slice(0, summaryStartIndex).join('\n')
    const summary = lines.slice(summaryStartIndex, summaryEndIndex).join('\n')

    return (header + '\n' + summary).trim()
  }

  private extractMostRecentEntry(changelog: string): string | null {
    const lines = changelog.split('\n')
    let startIndex = -1
    let endIndex = -1

    // Find the first version header (most recent)
    for (const [i, line] of lines.entries()) {
      const match = line.match(/^##? \[([^\]]+)\]/)
      if (match) {
        startIndex = i
        break
      }
    }

    if (startIndex === -1) {
      return null
    }

    // Find the end of the version entry (start of next version or end of file)
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].match(/^##? \[/)) {
        endIndex = i
        break
      }
    }

    if (endIndex === -1) {
      endIndex = lines.length
    }

    // Extract the entry
    const entry = lines.slice(startIndex, endIndex).join('\n').trim()

    return entry
  }

  private extractVersionEntry(changelog: string, version: string): string | null {
    // Handle different version formats (with or without 'v' prefix)
    const versionPattern = version.startsWith('v') ? version : `v${version}`
    const versionWithoutV = version.startsWith('v') ? version.slice(1) : version

    // Split the changelog by version headers
    // Headers can be like:
    // ## [11.0.0-beta.0](link) (date)
    // # [10.17.0](link) (date)
    const versionHeaderRegex = /^##? \[([^\]]+)\]/gm

    const lines = changelog.split('\n')
    let startIndex = -1
    let endIndex = -1
    let foundVersion = ''

    // Find the start of the version entry
    for (const [i, line] of lines.entries()) {
      const match = line.match(/^##? \[([^\]]+)\]/)
      if (match) {
        const versionInHeader = match[1]
        if (versionInHeader === versionWithoutV || versionInHeader === versionPattern) {
          startIndex = i
          foundVersion = versionInHeader
          break
        }
      }
    }

    if (startIndex === -1) {
      return null
    }

    // Find the end of the version entry (start of next version or end of file)
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].match(/^##? \[/)) {
        endIndex = i
        break
      }
    }

    if (endIndex === -1) {
      endIndex = lines.length
    }

    // Extract the entry
    const entry = lines.slice(startIndex, endIndex).join('\n').trim()

    return entry
  }
}
