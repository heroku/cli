import {color} from '@heroku/heroku-cli-util'
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
    `${color.command('heroku version:info')} # display the changelog for the latest version`,
    `${color.command('heroku version:info 11.0.0')} # display the changelog for version 11.0.0`,
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

      // Try to extract summary first
      const summary = this.extractSummary(entry)
      if (summary) {
        ux.stdout(summary)
      } else {
        // No summary, try to extract bugs and features
        const bugsAndFeatures = this.extractBugsAndFeatures(entry)
        if (bugsAndFeatures) {
          ux.stdout(bugsAndFeatures)
        } else {
          // No bugs, features, or summary found
          const header = this.extractHeader(entry)
          ux.stdout(header)
          ux.stdout('')
          ux.stdout('Miscellaneous improvements')
        }
      }

      ux.stdout('')
      ux.stdout('For the full changelog, visit: https://github.com/heroku/cli/blob/main/CHANGELOG.md')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        ux.error('CHANGELOG.md not found', {exit: 1})
      }

      throw error
    }
  }

  private extractHeader(entry: string): string {
    const lines = entry.split('\n')
    // Return the first non-empty line (the version header)
    for (const line of lines) {
      if (line.trim()) {
        return line.trim()
      }
    }

    return entry.split('\n')[0]
  }

  private extractSummary(entry: string): string | null {
    const lines = entry.split('\n')
    const header = this.extractHeader(entry)
    let summaryStartIndex = -1
    let summaryEndIndex = -1

    // Find if "### Summary" appears early in the entry (within first few lines after header)
    for (let i = 0; i < Math.min(10, lines.length); i++) {
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
      summaryEndIndex = lines.length
    }

    // Extract summary content
    const summaryContent = lines.slice(summaryStartIndex, summaryEndIndex).join('\n').trim()

    return header + '\n\n' + summaryContent
  }

  private extractBugsAndFeatures(entry: string): string | null {
    const lines = entry.split('\n')
    const header = this.extractHeader(entry)
    const sections: string[] = []

    let currentSection: string | null = null
    let currentContent: string[] = []

    for (const line of lines) {
      // Check if this is a ### header
      const headerMatch = line.match(/^###\s+(.+)$/)
      if (headerMatch) {
        // Save previous section if it was Bug Fixes or Features
        if (currentSection && (currentSection === 'Bug Fixes' || currentSection === 'Features')) {
          sections.push(`### ${currentSection}\n${currentContent.join('\n')}`)
        }

        // Start new section
        currentSection = headerMatch[1]
        currentContent = []
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line)
      }
    }

    // Save last section if it was Bug Fixes or Features
    if (currentSection && (currentSection === 'Bug Fixes' || currentSection === 'Features')) {
      sections.push(`### ${currentSection}\n${currentContent.join('\n')}`)
    }

    if (sections.length === 0) {
      return null
    }

    return header + '\n\n' + sections.join('\n\n').trim()
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
