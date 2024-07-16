import {Command, flags} from '@heroku-cli/command'
import {Args, Config} from '@oclif/core'
import {expect} from 'chai'
import * as path from 'path'

import Options from '../../../../src/commands/autocomplete/options'

const root = path.resolve(__dirname, '../../../package.json')
const config = new Config({root})

class TestCommand extends Command {
  static topic = 'foo'

  static command = 'bar'

  static description = 'baz'

  static flags = {
    app: flags.app(),
  }

  static args = {
    app: Args.string({required: false}),
  }

  async run() {
    'do work!'
  }
}

describe('AutocompleteOptions', function () {
  let cmd: any

  before(async function () {
    await config.load()
    cmd = new Options([], config)
  })

  describe('#findFlagFromWildArg', function () {
    it('finds flag from long and short name', function () {
      let output = cmd.findFlagFromWildArg('--app=my-app', TestCommand)
      expect(output.name).to.eq('app')
      output = cmd.findFlagFromWildArg('-a', TestCommand)
      expect(output.name).to.eq('app')
    })

    it('returns empty', function () {
      let output = cmd.findFlagFromWildArg('--', TestCommand)
      expect(output).to.not.have.property('output.name')
      output = cmd.findFlagFromWildArg('', TestCommand)
      expect(output).to.not.have.property('output.name')
    })
  })

  describe('#determineCmdState', function () {
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

    it('finds current state is neither a flag or flag value', function () {
      const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1'], TestCommand)
      expect([index, isFlag, isFlagValue]).to.include.members([false, false])
      const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', ''], TestCommand)
      expect([index2, isFlag2, isFlagValue2]).to.include.members([false, false])
      const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app=my-app', ''], TestCommand)
      expect([index3, isFlag3, isFlagValue3]).to.include.members([false, false])
    })

    describe('short flag', function () {
      it('finds current state is a flag', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-'], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([true, false])
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '-a'], TestCommand)
        expect([index2, isFlag2, isFlagValue2]).to.include.members([true, false])
      })

      it('finds current state is a flag value', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '-a', ''], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([false, true])
      })
    })

    describe('long flag', function () {
      it('finds current state is a flag', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--'], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([0, true, false])
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--a'], TestCommand)
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false])
        const [index3, isFlag3, isFlagValue3] = cmd.determineCmdState(['arg1', '--app'], TestCommand)
        expect([index3, isFlag3, isFlagValue3]).to.include.members([0, true, false])
      })

      it('finds current state is a flag value', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app', ''], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([0, false, true])
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app', 'my'], TestCommand)
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, false, true])
      })

      it('finds current state is a flag (special case)', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['arg1', '--app='], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([0, true, false])
        const [index2, isFlag2, isFlagValue2] = cmd.determineCmdState(['arg1', '--app=my'], TestCommand)
        expect([index2, isFlag2, isFlagValue2]).to.include.members([0, true, false])
      })
    })

    describe('args index', function () {
      it('argsIndex is 0', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['-a', 'my-app', ''], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([0, false, false])
        expect(cmd.parsedArgs).to.deep.equal({app: ''})
      })

      it('argsIndex is 1', function () {
        const [index, isFlag, isFlagValue] = cmd.determineCmdState(['foo', '-a', 'my-app', ''], TestCommand)
        expect([index, isFlag, isFlagValue]).to.include.members([1, false, false])
        expect(cmd.parsedArgs).to.deep.equal({app: 'foo'})
      })
    })
  })
})
