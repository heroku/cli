/* eslint-env mocha */

import {expect, test} from '@oclif/test'
import {checkTos} from '../../../src/hooks/init/terms-of-service'
import * as fs from 'fs-extra'
import {join} from 'path'

const options = {
  config: {
    cacheDir: '/tmp/',
  },
}

const tosPath: string = join(options.config.cacheDir, 'terms-of-service')

describe('terms-of-service hook', () => {
  afterEach(() => {
    fs.removeSync(tosPath)
  })

  describe('has never run before', () => {
    test
      .stderr()
      .do(() => checkTos(options))
      .it('warns of new terms of service', context => {
        expect(context.stderr).to.contain('Our terms of service have changed')
      })
  })

  describe('has run once before', () => {
    beforeEach(() => {
      fs.createFileSync(tosPath)
    })

    test
      .stderr()
      .do(() => checkTos(options))
      .it('does not give a warning', context => {
        expect(context.stderr).to.not.contain('Our terms of service have changed')
      })
  })
})
