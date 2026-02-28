/* eslint-env mocha */

import {expect} from 'chai'
import {stdout} from 'stdout-stderr'
import VersionInfo from '../../../../src/commands/version/info.js'

describe('version:info', function () {
  describe('extractSummaryIfFirst', function () {
    it('should extract only summary when it is the first section', function () {
      const entry = `## [11.0.0-beta.0](link) (2026-02-26)

### Summary

This is a major release with extensive changes.

Key changes:
1. Feature A
2. Feature B

### Features

- Feature 1
- Feature 2

### Bug Fixes

- Fix 1`

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractSummaryIfFirst(entry)

      expect(result).to.include('## [11.0.0-beta.0]')
      expect(result).to.include('### Summary')
      expect(result).to.include('This is a major release')
      expect(result).to.include('Feature A')
      expect(result).to.not.include('### Features')
      expect(result).to.not.include('Feature 1')
      expect(result).to.not.include('### Bug Fixes')
    })

    it('should return null when Summary is not the first section', function () {
      const entry = `## [10.12.0](link) (2025-07-17)

### Features

- Feature 1

### Summary

Some summary here`

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractSummaryIfFirst(entry)

      expect(result).to.be.null
    })

    it('should return null when there is no Summary section', function () {
      const entry = `## [10.12.0](link) (2025-07-17)

### Features

- Feature 1`

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractSummaryIfFirst(entry)

      expect(result).to.be.null
    })
  })

  describe('extractMostRecentEntry', function () {
    it('should extract the most recent version entry', function () {
      const changelog = `# Change Log

## [11.0.0-beta.0](link) (2026-02-26)

### Summary

This is a major release.

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1`

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractMostRecentEntry(changelog)

      expect(result).to.include('## [11.0.0-beta.0]')
      expect(result).to.include('This is a major release')
      expect(result).to.not.include('10.17.0')
      expect(result).to.not.include('Fix 1')
    })

    it('should return null for empty changelog', function () {
      const changelog = `# Change Log

No versions yet.`

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractMostRecentEntry(changelog)

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

      const command = new VersionInfo([], {} as any)
      // Access the private method for testing
      const result = (command as any).extractVersionEntry(changelog, '11.0.0-beta.0')

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

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractVersionEntry(changelog, '10.17.0')

      expect(result).to.include('[10.17.0]')
      expect(result).to.include('Fix 1')
      expect(result).to.not.include('10.16.0')
    })

    it('should return null for non-existent version', function () {
      const changelog = `# Change Log

# [10.17.0](link) (2026-02-10)

### Bug Fixes

- Fix 1`

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractVersionEntry(changelog, '99.99.99')

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

      const command = new VersionInfo([], {} as any)
      const result = (command as any).extractVersionEntry(changelog, '10.16.0')

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

      const command = new VersionInfo([], {} as any)

      const betaResult = (command as any).extractVersionEntry(changelog, '11.0.0-beta.0')
      expect(betaResult).to.include('## [11.0.0-beta.0]')
      expect(betaResult).to.include('Beta release')

      const stableResult = (command as any).extractVersionEntry(changelog, '10.17.0')
      expect(stableResult).to.include('# [10.17.0]')
      expect(stableResult).to.include('Fix 1')
    })
  })
})
