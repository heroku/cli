import Config from '@cli-engine/engine/lib/config'
import { UserPlugin } from '@cli-engine/engine/lib/plugins/user'
import { flags } from '@heroku-cli/command'
import * as os from 'os'
import * as path from 'path'

import AutocompleteCacheBuilder from './cache'

const FOO_PLUGIN_PATH = '../../../test/roots/foo-plugin'
const FooPluginPjson = require(`${FOO_PLUGIN_PATH}/package.json`)
const AC_PLUGIN_PATH = path.resolve(__dirname, '..', '..', '..')

class CacheBuildFlagsTest extends AutocompleteCacheBuilder {
  static flags = {
    app: flags.app(),
    visable: flags.boolean({ description: 'Visable flag', char: 'v' }),
    hidden: flags.boolean({ description: 'Hidden flag', char: 'h', hidden: true }),
  }
}

// autocomplete will throw error on windows
let runtest = (os.platform() as any) === 'windows' || os.platform() === 'win32' ? xtest : test

describe('AutocompleteCacheBuilder', () => {
  // Unit test private methods for extra coverage
  describe('private methods', () => {
    let cmd: any
    beforeAll(() => {
      const root = path.resolve(__dirname, FOO_PLUGIN_PATH)
      const config = new Config()
      cmd = new AutocompleteCacheBuilder(config)
      let u = new UserPlugin({
        type: 'user',
        pjson: FooPluginPjson,
        tag: '0.0.0',
        root,
        config,
      })
      cmd.plugins = () => {
        return [u]
      }
    })

    runtest('#genCmdID', async () => {
      expect(cmd.genCmdID(AutocompleteCacheBuilder)).toBe('autocomplete:buildcache')
    })

    runtest('#genCmdWithDescription', async () => {
      expect(await cmd.genCmdWithDescription(AutocompleteCacheBuilder)).toBe(
        `"autocomplete\\:buildcache":"autocomplete cache builder"`,
      )
    })

    runtest('#genCmdPublicFlags', async () => {
      expect(cmd.genCmdPublicFlags(CacheBuildFlagsTest)).toBe('--app --visable')
      expect(cmd.genCmdPublicFlags(AutocompleteCacheBuilder)).toBe('')
    })

    runtest('#genCmdsCacheStrings (cmdsWithFlags)', async () => {
      const cacheStrings = await cmd.genCmdsCacheStrings()
      expect(cacheStrings.cmdsWithFlags).toBe('foo:alpha --bar\nfoo:beta')
    })

    runtest('#genCmdsCacheStrings (cmdFlagsSetters)', async () => {
      const cacheStrings = await cmd.genCmdsCacheStrings()
      expect(cacheStrings.cmdFlagsSetters).toBe(`_set_foo_alpha_flags () {
_flags=(
"--bar[(switch) bar flag]"
)
}

# no flags for foo:beta`)
    })

    runtest('#genCmdsCacheStrings (cmdsWithDescSetter)', async () => {
      const cacheStrings = await cmd.genCmdsCacheStrings()
      expect(cacheStrings.cmdsWithDescSetter).toBe(`
_set_all_commands_list () {
_all_commands_list=(
"foo\\:alpha":"foo:alpha description"
"foo\\:beta":"foo:beta description"
)
}
`)
    })

    runtest('#genCompletionDotsFunc', async () => {
      expect(await cmd.genCompletionDotsFunc()).toBe(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`)
    })

    runtest('#genShellSetups (0: bash)', async () => {
      // let cmd = await new AutocompleteCacheBuilder(new Config())
      let shellSetups = await cmd.genShellSetups()
      expect(shellSetups[0]).toBe(`CLI_ENGINE_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/completions/completion_analytics;
CLI_ENGINE_AC_COMMANDS_PATH=${cmd.config.cacheDir}/completions/commands;
CLI_ENGINE_AC_BASH_COMPFUNC_PATH=${AC_PLUGIN_PATH}/autocomplete/bash/cli_engine.bash && test -f $CLI_ENGINE_AC_BASH_COMPFUNC_PATH && source $CLI_ENGINE_AC_BASH_COMPFUNC_PATH;
`)
    })

    runtest('#genShellSetups (1: zsh)', async () => {
      // let cmd = await new AutocompleteCacheBuilder(new Config())
      let shellSetups = await cmd.genShellSetups()
      expect(shellSetups[1]).toBe(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots
CLI_ENGINE_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/completions/completion_analytics;
CLI_ENGINE_AC_COMMANDS_PATH=${cmd.config.cacheDir}/completions/commands;
CLI_ENGINE_AC_ZSH_SETTERS_PATH=\${CLI_ENGINE_AC_COMMANDS_PATH}_functions && test -f $CLI_ENGINE_AC_ZSH_SETTERS_PATH && source $CLI_ENGINE_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_PLUGIN_PATH}/autocomplete/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`)
    })

    runtest('#genShellSetups (1: zsh w/o ellipsis)', async () => {
      // let cmd = await new AutocompleteCacheBuilder()
      let shellSetups = await cmd.genShellSetups(true)
      expect(shellSetups[1]).toBe(`
CLI_ENGINE_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/completions/completion_analytics;
CLI_ENGINE_AC_COMMANDS_PATH=${cmd.config.cacheDir}/completions/commands;
CLI_ENGINE_AC_ZSH_SETTERS_PATH=\${CLI_ENGINE_AC_COMMANDS_PATH}_functions && test -f $CLI_ENGINE_AC_ZSH_SETTERS_PATH && source $CLI_ENGINE_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_PLUGIN_PATH}/autocomplete/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`)
    })

    runtest('#genZshAllCmdsListSetter', async () => {
      let cmdsWithDesc = [`"foo\\:alpha":"foo:alpha description"`, `"foo\\:beta":"foo:beta description"`]
      expect(await cmd.genZshAllCmdsListSetter(cmdsWithDesc)).toBe(`
_set_all_commands_list () {
_all_commands_list=(
"foo\\:alpha":"foo:alpha description"
"foo\\:beta":"foo:beta description"
)
}
`)
    })

    runtest('#genZshCmdFlagsSetter', async () => {
      expect(await cmd.genZshCmdFlagsSetter(CacheBuildFlagsTest)).toBe(`_set_autocomplete_buildcache_flags () {
_flags=(
"--app=-[(autocomplete) app to run command against]: :_compadd_flag_options"
"--visable[(switch) Visable flag]"
)
}
`)
    })
  })
})
