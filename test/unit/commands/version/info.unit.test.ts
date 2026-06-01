import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import Info from '../../../../src/commands/version/info.js'

describe('version:info', function () {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const fixtureChangelogPath = join(__dirname, '..', '..', '..', 'fixtures', 'CHANGELOG.md')

  beforeEach(function () {
    process.env.HEROKU_CHANGELOG_PATH = fixtureChangelogPath
  })

  afterEach(function () {
    delete process.env.HEROKU_CHANGELOG_PATH
  })

  it('should display most recent version info when no version arg provided', async function () {
    const {stdout} = await runCommand(Info)

    // Should contain the most recent version from fixture (2.0.0)
    expect(stdout).to.include('2.0.0')
    expect(stdout).to.include('This is a major release with breaking changes')
    // Should contain link to full changelog
    expect(stdout).to.include('For the full changelog, visit: https://github.com/heroku/cli/blob/main/CHANGELOG.md')
  })

  it('should display specific version info when version arg provided', async function () {
    const {stdout} = await runCommand(Info, ['1.5.0'], import.meta.url)

    expect(stdout).to.include('1.5.0')
    expect(stdout).to.include('Added feature P')
    expect(stdout).to.include('Fixed bug C')
    expect(stdout).to.include('For the full changelog, visit: https://github.com/heroku/cli/blob/main/CHANGELOG.md')
  })

  it('should display summary section if present', async function () {
    const {stdout} = await runCommand(Info)

    // Most recent version (2.0.0) has a summary section
    expect(stdout).to.include('This is a major release with breaking changes')
    expect(stdout).to.include('New feature X')
  })

  it('should display bug fixes and features when no summary', async function () {
    const {stdout} = await runCommand(Info, ['1.5.0'], import.meta.url)

    // Version 1.5.0 has no summary, should show features and bug fixes
    expect(stdout).to.include('Added feature P')
    expect(stdout).to.include('Fixed bug C')
  })

  it('should display miscellaneous when no summary or bug fixes/features', async function () {
    const {stdout} = await runCommand(Info, ['1.3.0'], import.meta.url)

    // Version 1.3.0 only has features
    expect(stdout).to.include('1.3.0')
    expect(stdout).to.include('Added feature R')
  })

  it('should handle version without v prefix', async function () {
    // Should work with or without 'v' prefix
    const {stdout} = await runCommand(Info, ['2.0.0'], import.meta.url)

    expect(stdout).to.include('2.0.0')
  })

  it('should error when version not found', async function () {
    const {error} = await runCommand(Info, ['99.99.99'], import.meta.url)

    expect(error?.message).to.include('Version 99.99.99 not found in CHANGELOG.md')
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('should display formatted output', async function () {
    const {stdout} = await runCommand(Info)

    // Output should be non-empty and contain some markdown-rendered content
    expect(stdout.trim()).to.not.be.empty
    // Should have the footer link
    expect(stdout).to.include('https://github.com/heroku/cli/blob/main/CHANGELOG.md')
  })
})
