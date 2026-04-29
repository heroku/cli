import {expect} from 'chai'

import {ChangelogParser} from '../../../src/lib/changelog-parser.js'

describe('ChangelogParser', function () {
  describe('extractMostRecentEntry', function () {
    it('should extract the most recent version entry', function () {
      const changelog = `# Change Log

## [11.0.0-beta.0](link) (2026-02-26)

### Summary

This is a major release.

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1`

      const parser = ChangelogParser.fromString(changelog)
      const result = parser.extractMostRecentEntry()

      expect(result).to.include('## [11.0.0-beta.0]')
      expect(result).to.include('This is a major release')
      expect(result).to.not.include('10.17.0')
      expect(result).to.not.include('Fix 1')
    })

    it('should return null for empty changelog', function () {
      const changelog = `# Change Log

No versions yet.`

      const parser = ChangelogParser.fromString(changelog)
      const result = parser.extractMostRecentEntry()

      expect(result).to.be.null
    })
  })

  describe('extractVersionEntry', function () {
    it('should extract a version entry from changelog', function () {
      const changelog = `# Change Log

## [11.0.0-beta.0](link) (2026-02-26)

### Summary

This is a major release.

### Features

- New feature 1
- New feature 2

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1
- Fix 2

# [10.16.0](link) (2025-12-01)

### Features

- Feature A`

      const parser = ChangelogParser.fromString(changelog)
      const result = parser.extractVersionEntry('11.0.0-beta.0')

      expect(result).to.include('## [11.0.0-beta.0]')
      expect(result).to.include('This is a major release')
      expect(result).to.include('New feature 1')
      expect(result).to.not.include('10.17.0')
      expect(result).to.not.include('Fix 1')
    })

    it('should handle version without v prefix', function () {
      const changelog = `# Change Log

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1

# [10.16.0](link) (2025-12-01)`

      const parser = ChangelogParser.fromString(changelog)
      const result = parser.extractVersionEntry('10.17.0')

      expect(result).to.include('[10.17.0]')
      expect(result).to.include('Fix 1')
      expect(result).to.not.include('10.16.0')
    })

    it('should return null for non-existent version', function () {
      const changelog = `# Change Log

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1`

      const parser = ChangelogParser.fromString(changelog)
      const result = parser.extractVersionEntry('99.99.99')

      expect(result).to.be.null
    })

    it('should handle the last entry in the changelog', function () {
      const changelog = `# Change Log

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1

# [10.16.0](link) (2025-12-01)

### Features

- Last entry feature
- Another feature`

      const parser = ChangelogParser.fromString(changelog)
      const result = parser.extractVersionEntry('10.16.0')

      expect(result).to.include('[10.16.0]')
      expect(result).to.include('Last entry feature')
      expect(result).to.include('Another feature')
    })

    it('should handle both ## and # headers', function () {
      const changelog = `# Change Log

## [11.0.0-beta.0](link) (2026-02-26)

### Summary

Beta release

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1`

      const parser = ChangelogParser.fromString(changelog)

      const betaResult = parser.extractVersionEntry('11.0.0-beta.0')
      expect(betaResult).to.include('## [11.0.0-beta.0]')
      expect(betaResult).to.include('Beta release')

      const stableResult = parser.extractVersionEntry('10.17.0')
      expect(stableResult).to.include('# [10.17.0]')
      expect(stableResult).to.include('Fix 1')
    })
  })
})
