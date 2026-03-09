import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

export class ChangelogParser {
  private constructor(private readonly changelog: string) {}

  private normalizeLineEndings(text: string): string {
    // Normalize CRLF (\r\n) to LF (\n) for consistent parsing across platforms
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  static async create(changelogPath?: string): Promise<ChangelogParser> {
    // Allow overriding path via environment variable (useful for testing)
    const path = changelogPath ?? process.env.HEROKU_CHANGELOG_PATH ?? ChangelogParser.getDefaultChangelogPath()
    const content = await readFile(path, 'utf8')
    return new ChangelogParser(content)
  }

  static fromString(changelog: string): ChangelogParser {
    return new ChangelogParser(changelog)
  }

  private static getDefaultChangelogPath(): string {
    // Find the CHANGELOG.md file relative to the CLI installation
    const __dirname = fileURLToPath(new URL('.', import.meta.url))
    return join(__dirname, '..', '..', 'CHANGELOG.md')
  }

  extractHeader(entry: string): string {
    const normalized = this.normalizeLineEndings(entry)
    return normalized.split('\n').find(line => line.trim()) || normalized.split('\n')[0]
  }

  extractMostRecentEntry(): null | string {
    return this.extractEntry(() => true) // First match is most recent
  }

  extractSection(entry: string, sectionName: string): null | string {
    return this.extractSections(entry, [sectionName])
  }

  extractSections(entry: string, sectionNames: string[]): null | string {
    const normalized = this.normalizeLineEndings(entry)
    const lines = normalized.split('\n')
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

  extractVersionEntry(version: string): null | string {
    const versionWithoutV = version.startsWith('v') ? version.slice(1) : version
    return this.extractEntry(v => v === versionWithoutV || v === `v${versionWithoutV}`)
  }

  private extractEntry(predicate: (versionInHeader: string) => boolean): null | string {
    const normalized = this.normalizeLineEndings(this.changelog)
    const lines = normalized.split('\n')
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
}
