import { Config } from '@cli-engine/engine/lib/config'
import { Command, flags } from '@heroku-cli/command'

import Options from './options'

class TestCommand extends Command {
  static topic = 'foo'
  static command = 'bar'
  static description = 'baz'
  static flags = {
    app: flags.app(),
  }
  static args = [{ name: 'app', required: false }]
  async run() {}
}

describe('AutocompleteOptions', () => {
  let cmd: any
  beforeAll(() => {
    cmd = new Options(new Config())
  })

  describe('#findFlagFromWildArg', () => {
    test('finds flag from long and short name', () => {
      let output = cmd.findFlagFromWildArg('--app=my-app', TestCommand)
      expect(output.name).toEqual('app')
      output = cmd.findFlagFromWildArg('-a', TestCommand)
      expect(output.name).toEqual('app')
    })

    test('returns empty', () => {
      let output = cmd.findFlagFromWildArg('--', TestCommand)
      expect(output).not.toHaveProperty('output.name')
      output = cmd.findFlagFromWildArg('', TestCommand)
      expect(output).not.toHaveProperty('output.name')
    })
  })

  describe('#determineCmdState', () => {
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

    // foo:bar -a my-app | false false

    test('finds current state is neither a flag or flag value', () => {
      let [isFlag, isFlagValue] = cmd.determineCmdState(['arg1'], TestCommand)
      expect([isFlag, isFlagValue]).toEqual([false, false])
      let [isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', ''], TestCommand)
      expect([isFlag2, isFlagValue2]).toEqual([false, false])
      let [isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app=my-app', ''], TestCommand)
      expect([isFlag3, isFlagValue3]).toEqual([false, false])
    })

    describe('short flag', () => {
      test('finds current state is a flag', () => {
        let [isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-'], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([true, false])
        let [isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '-a'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([true, false])
      })

      test('finds current state is a flag value', () => {
        let [isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-a', ''], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([false, true])
      })
    })

    describe('long flag', () => {
      test('finds current state is a flag', () => {
        let [isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--'], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([true, false])
        let [isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--a'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([true, false])
        let [isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app'], TestCommand)
        expect([isFlag3, isFlagValue3]).toEqual([true, false])
      })

      test('finds current state is a flag value', () => {
        let [isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app', ''], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([false, true])
        let [isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app', 'my'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([false, true])
      })

      test('finds current state is a flag (special case)', () => {
        let [isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app='], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([true, false])
        let [isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app=my'], TestCommand)
        expect([isFlag2, isFlagValue2]).toEqual([true, false])
      })
    })

    describe('flags before args', () => {
      test('parsedArgs is 1', () => {
        let [isFlag, isFlagValue] = cmd.determineCmdState(['-a', 'my-app', ''], TestCommand)
        expect([isFlag, isFlagValue]).toEqual([false, false])
        expect(cmd.parsedArgs).toMatchObject({ app: '' })
      })
    })
  })
})
