import {expect} from '@oclif/test'
import * as path from 'path'

import Utils from '../src/utils'

describe('utils', () => {
  describe('hasValidChecksum', () => {
    it('indicates valid checksum', async () => {
      const fixtureArchive = path.join(__dirname, 'fixtures', 'archive.json.gz')
      expect(await Utils.hasValidChecksum(fixtureArchive, '0da8fa9d50091345951cc5090d82bc4dd965dc33528d7b79188c9508fc9d17db')).to.eq(true)
    })

    it('indicates invalid checksum', async () => {
      const fixtureArchive = path.join(__dirname, 'fixtures', 'archive.json.gz')
      expect(await Utils.hasValidChecksum(fixtureArchive, 'blahblah')).to.eq(false)
    })
  })

  describe('filesize', () => {
    it('generates string with filesize and corresponding units', () => {
      expect(Utils.filesize(345)).to.eq('345.0 B')
      expect(Utils.filesize(12844)).to.eq('12.5 KB')
      expect(Utils.filesize(78909499)).to.eq('75.3 MB')
    })
  })
})
