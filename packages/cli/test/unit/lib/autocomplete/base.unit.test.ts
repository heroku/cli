import {flags} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {expect} from 'chai'
import * as path from 'path'

import {AutocompleteBase} from '../../../../src/lib/autocomplete/base'

// autocomplete will throw error on windows
const {default: runtest} = require('../../../helpers/autocomplete/runtest')

class AutocompleteTest extends AutocompleteBase {
  static id = 'test:foo'

  static flags = {
    app: flags.app(),
    bar: flags.boolean(),
  }

  async run() {
    'do work!'
  }
}

const root = path.resolve(__dirname, '../../package.json')
const config = new Config({root})

const cmd = new AutocompleteTest([], config)

runtest('AutocompleteBase', () => {
  before(async function () {
    await config.load()
  })

  it('#errorIfWindows', async function () {
    try {
      new AutocompleteTest([], config).errorIfWindows()
    } catch (error: any) {
      expect(error.message).to.eq('Autocomplete is not currently supported in Windows')
    }
  })

  it('#autocompleteCacheDir', async function () {
    expect(cmd.autocompleteCacheDir).to.eq(path.join(config.cacheDir, 'autocomplete'))
  })

  it('#completionsCacheDir', async function () {
    expect(cmd.completionsCacheDir).to.eq(path.join(config.cacheDir, 'autocomplete', 'completions'))
  })

  it('#acLogfilePath', async function () {
    expect(cmd.acLogfilePath).to.eq(path.join(config.cacheDir, 'autocomplete.log'))
  })

  it('#findCompletion', async function () {
    expect((cmd as any).findCompletion(AutocompleteTest.id, 'app')).to.be.ok
    expect((cmd as any).findCompletion(AutocompleteTest.id, 'bar')).to.not.be.ok
  })
})
