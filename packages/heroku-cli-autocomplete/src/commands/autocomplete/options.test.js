// @flow

import Options from './options'
// import os from 'os'
import {Command, flags} from 'cli-engine-heroku'

class TestCommand extends Command {
  static topic = 'foo'
  static command = 'bar'
  static description = 'baz'
  static flags = {
    app: flags.app()
  }
}

// autocomplete will throw error on windows
// let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

describe('AutocompleteOptions', () => {
  let cmd
  beforeAll(() => {
    cmd = new Options()
  })

  describe('#_findFlagFromWildArg', () => {
    test('finds flag from long and short name', () => {
      // let cmd = await Options.mock('heroku foo:bar --app=')
      // expect(cmd.out.stdout.output).toMatch(/\/cli-engine\/completions\/zsh_setup/)
      var output = cmd._findFlagFromWildArg('--app=my-app', TestCommand)
      expect(output.name).toEqual('app')
      output = cmd._findFlagFromWildArg('-a', TestCommand)
      expect(output.name).toEqual('app')
    })

    test('returns empty', () => {
      var output = cmd._findFlagFromWildArg('--', TestCommand)
      expect(output).not.toHaveProperty('output.name')
      output = cmd._findFlagFromWildArg('', TestCommand)
      expect(output).not.toHaveProperty('output.name')
    })
  })

  describe('#_determineCmdState', () => {
    // foo:bar arg1| false, false
    // foo:bar arg1 | false, false
    // foo:bar arg1 --app=my-app | false, false

    // foo:bar arg1 -| true, false
    // foo:bar arg1 -a| true, false

    // foo:bar arg1 -a | false, true

    // foo:bar arg1 --| true, false
    // foo:bar arg1 --a| true, false
    // foo:bar arg1 --app| true, false

    // foo:bar arg1 --app | false, true
    // foo:bar arg1 --app my| false, true

    // foo:bar arg1 --app=| true, false
    // foo:bar arg1 --app=my| true, false

    test('finds current state is neither a flag or flag value', () => {
      let [isFlag, isFlagValue] = cmd._determineCmdState(['arg1'], TestCommand)
      expect([isFlag, isFlagValue]).toEqual([false, false])
      let [isFlag2, isFlagValue2] = cmd._determineCmdState(['arg1', ''], TestCommand)
      expect([isFlag2, isFlagValue2]).toEqual([false, false])
      let [isFlag3, isFlagValue3] = cmd._determineCmdState(['arg1', '--app=my-app', ''], TestCommand)
      expect([isFlag3, isFlagValue3]).toEqual([false, false])
    })

    describe('short flag', () => {
      test('finds current state is a flag', () => {
        let [isFlag, isFlagValue] = cmd._determineCmdState(['arg1', '-'], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([true, false])
        let [isFlag2, isFlagValue2] = cmd._determineCmdState(['arg1', '-a'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([true, false])
      })

      test('finds current state is a flag value', () => {
        let [isFlag, isFlagValue] = cmd._determineCmdState(['arg1', '-a', ''], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([false, true])
      })
    })

    describe('long flag', () => {
      test('finds current state is a flag', () => {
        let [isFlag, isFlagValue] = cmd._determineCmdState(['arg1', '--'], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([true, false])
        let [isFlag2, isFlagValue2] = cmd._determineCmdState(['arg1', '--a'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([true, false])
        let [isFlag3, isFlagValue3] = cmd._determineCmdState(['arg1', '--app'], TestCommand)
        expect([isFlag3, isFlagValue3]).toEqual([true, false])
      })

      test('finds current state is a flag value', () => {
        let [isFlag, isFlagValue] = cmd._determineCmdState(['arg1', '--app', ''], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([false, true])
        let [isFlag2, isFlagValue2] = cmd._determineCmdState(['arg1', '--app', 'my'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([false, true])
      })

      test('finds current state is a flag (special case)', () => {
        let [isFlag, isFlagValue] = cmd._determineCmdState(['arg1', '--app='], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([true, false])
        let [isFlag2, isFlagValue2] = cmd._determineCmdState(['arg1', '--app=my'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([true, false])
      })
    })
  })
})
