// @flow

import Config from '@cli-engine/config'
import * as os from 'os'
import * as path from 'path'

import { AutocompleteBase } from './autocomplete'

// autocomplete will throw error on windows
let runtest = (os.platform() as string) === 'windows' || os.platform() === 'win32' ? xtest : test

class AutocompleteTest extends AutocompleteBase {
  async run() {}
}
const cmd = new AutocompleteTest(new Config())

describe('AutocompleteBase', () => {
  runtest('#errorIfWindows', async () => {
    try {
      let config = new Config({ platform: 'win32' })
      new AutocompleteTest(config).errorIfWindows()
    } catch (e) {
      expect(e.message).toMatch('Autocomplete is not currently supported in Windows')
    }
  })

  runtest('#completionsCachePath', async () => {
    expect(cmd.completionsCachePath).toBe(path.join(new Config().cacheDir, 'completions'))
  })

  runtest('#acLogfile', async () => {
    expect(cmd.acLogfile).toBe(path.join(new Config().cacheDir, 'autocomplete.log'))
  })
})
