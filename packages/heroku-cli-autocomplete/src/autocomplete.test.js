// @flow

import {AutocompleteBase} from './autocomplete'
import os from 'os'
import path from 'path'

// autocomplete will throw error on windows
let runtest = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

const cmd = new AutocompleteBase()

describe('AutocompleteBase', () => {
  runtest('#errorIfWindows', async () => {
    try {
      new AutocompleteBase({windows: true}).errorIfWindows()
    } catch (e) {
      expect(e).toMatch('Autocomplete is not currently supported in Windows')
    }
  })

  runtest('#completionsCachePath', async () => {
    expect(cmd.completionsCachePath).toBe(path.join(cmd.config.cacheDir, 'completions'))
  })

  runtest('#acLogfile', async () => {
    expect(cmd.acLogfile).toBe(path.join(cmd.config.cacheDir, 'autocomplete.log'))
  })
})
