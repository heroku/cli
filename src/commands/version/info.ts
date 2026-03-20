import * as color from '@heroku/heroku-cli-util/color'
import {Args, Command, ux} from '@oclif/core'
import {marked, type MarkedExtension} from 'marked'
import {markedTerminal} from 'marked-terminal'

import {ChangelogParser} from '../../lib/changelog-parser.js'

// Configure marked to use terminal renderer
// Note: @types/marked-terminal has incorrect return type, but the actual implementation
// returns a proper MarkedExtension object
marked.use(markedTerminal({emoji: false}) as MarkedExtension)

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
      // Create parser (uses default changelog path)
      const parser = await ChangelogParser.create()
      const entry = version
        ? parser.extractVersionEntry(version)
        : parser.extractMostRecentEntry()

      if (!entry) {
        const msg = version ? `Version ${version} not found in CHANGELOG.md` : 'No version entries found in CHANGELOG.md'
        ux.error(msg, {exit: 1})
      }

      // Display content based on what's available
      const summary = parser.extractSection(entry, 'Summary')
      if (summary) {
        ux.stdout(await marked(summary))
      } else {
        const bugsAndFeatures = parser.extractSections(entry, ['Bug Fixes', 'Features'])
        if (bugsAndFeatures) {
          ux.stdout(await marked(bugsAndFeatures))
        } else {
          ux.stdout(await marked(parser.extractHeader(entry)))
          ux.stdout(await marked('* Miscellaneous improvements'))
        }
      }

      ux.stdout('')
      ux.stdout(await marked('* For the full changelog, visit: https://github.com/heroku/cli/blob/main/CHANGELOG.md'))
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        ux.error('CHANGELOG.md not found', {exit: 1})
      }

      throw error
    }
  }
}
