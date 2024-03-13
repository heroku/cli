import {Config, Plugin} from '@oclif/core'
import {loadJSON} from '@oclif/core/lib/config/util'
import {expect} from 'chai'
import * as path from 'path'

import Create from '../../../../src/commands/autocomplete/create'

const root = path.resolve(__dirname, '../../../package.json')
const config = new Config({root})

// autocomplete will throw error on windows
const {default: runtest} = require('../../../helpers/autocomplete/runtest')

const AC_LIB_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'autocomplete-scripts')

const CacheBuildFlagsTest = {
  id: 'autocomplete:create',
  flags:
  {app: {name: 'app', type: 'option', description: 'app to use'},
    visible: {name: 'visible', type: 'boolean', description: 'visible flag'},
    hidden: {name: 'hidden', type: 'boolean', description: 'hidden flag', hidden: true},
  },
  args: [],
}

runtest('Create', () => {
  // Unit test private methods for extra coverage
  describe('private methods', () => {
    let cmd: any
    let Klass: any
    let plugin: any
    before(async () => {
      await config.load()
      cmd = new Create([], config)
      plugin = new Plugin({root})
      cmd.config.plugins = [plugin]
      await plugin.load()
      // eslint-disable-next-line require-atomic-updates
      plugin.manifest = await loadJSON(path.resolve(__dirname, '../../../test.oclif.manifest.json'))
      // eslint-disable-next-line require-atomic-updates
      plugin.commands = Object.entries(plugin.manifest.commands).map(([id, c]) => ({
        ...c as Record<string, unknown>,
        load: () => plugin.findCommand(id, {must: true})}
      ))
      Klass = plugin.commands[1]
    })

    it('file paths', () => {
      const dir = cmd.config.cacheDir
      expect(cmd.bashSetupScriptPath).to.eq(`${dir}/autocomplete/bash_setup`)
      expect(cmd.zshSetupScriptPath).to.eq(`${dir}/autocomplete/zsh_setup`)
      expect(cmd.bashCommandsListPath).to.eq(`${dir}/autocomplete/commands`)
      expect(cmd.zshCompletionSettersPath).to.eq(`${dir}/autocomplete/commands_setters`)
    })

    it('#genCmdWithDescription', () => {
      expect(cmd.genCmdWithDescription(Klass)).to.eq(
        '"autocomplete\\:foo":"foo cmd for autocomplete testing"',
      )
    })

    it('#genCmdPublicFlags', () => {
      expect(cmd.genCmdPublicFlags(CacheBuildFlagsTest)).to.eq('--app --visible')
      expect(cmd.genCmdPublicFlags(CacheBuildFlagsTest)).to.not.match(/--hidden/)
      expect(cmd.genCmdPublicFlags(Create)).to.eq('')
    })

    it('#bashCommandsList', () => {
      expect(cmd.bashCommandsList).to.eq('autocomplete --skip-instructions\nautocomplete:foo --app --bar --json')
    })

    it('#zshCompletionSetters', () => {
      expect(cmd.zshCompletionSetters).to.eq(`
_set_all_commands_list () {
_all_commands_list=(
"autocomplete":"display autocomplete instructions"
"autocomplete\\:foo":"foo cmd for autocomplete testing"
)
}

_set_autocomplete_flags () {
_flags=(
"--skip-instructions[(switch) Do not show installation instructions]"
)
}

_set_autocomplete_foo_flags () {
_flags=(
"--app=-[(autocomplete) app to use]: :_compadd_flag_options"
"--bar=-[bar for testing]"
"--json[(switch) output in json format]"
)
}
`)
    })

    it('#genCompletionDotsFunc', () => {
      expect(cmd.completionDotsFunc).to.eq(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`)
    })

    it('#bashSetupScript', () => {
      const shellSetup = cmd.bashSetupScript
      expect(shellSetup).to.eq(`HEROKU_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
HEROKU_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
HEROKU_AC_BASH_COMPFUNC_PATH=${AC_LIB_PATH}/bash/heroku.bash && test -f $HEROKU_AC_BASH_COMPFUNC_PATH && source $HEROKU_AC_BASH_COMPFUNC_PATH;
`)
    })

    it('#zshSetupScript', () => {
      const shellSetup = cmd.zshSetupScript
      expect(shellSetup).to.eq(`expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots
HEROKU_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
HEROKU_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
HEROKU_AC_ZSH_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_setters && test -f $HEROKU_AC_ZSH_SETTERS_PATH && source $HEROKU_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_LIB_PATH}/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`)
    })

    it('#zshSetupScript (w/o ellipsis)', () => {
      const oldEnv = process.env
      process.env.HEROKU_AC_ZSH_SKIP_ELLIPSIS = '1'
      const shellSetup = cmd.zshSetupScript

      expect(shellSetup).to.eq(`
HEROKU_AC_ANALYTICS_DIR=${cmd.config.cacheDir}/autocomplete/completion_analytics;
HEROKU_AC_COMMANDS_PATH=${cmd.config.cacheDir}/autocomplete/commands;
HEROKU_AC_ZSH_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_setters && test -f $HEROKU_AC_ZSH_SETTERS_PATH && source $HEROKU_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_LIB_PATH}/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`)
      process.env = oldEnv
    })

    it('#genZshAllCmdsListSetter', () => {
      const cmdsWithDesc = ['"foo\\:alpha":"foo:alpha description"', '"foo\\:beta":"foo:beta description"']
      expect(cmd.genZshAllCmdsListSetter(cmdsWithDesc)).to.eq(`
_set_all_commands_list () {
_all_commands_list=(
"foo\\:alpha":"foo:alpha description"
"foo\\:beta":"foo:beta description"
)
}
`)
    })

    it('#genZshCmdFlagsSetter', () => {
      expect(cmd.genZshCmdFlagsSetter(CacheBuildFlagsTest)).to.eq(`_set_autocomplete_create_flags () {
_flags=(
"--app=-[(autocomplete) app to use]: :_compadd_flag_options"
"--visible[(switch) visible flag]"
)
}
`)
    })
  })
})
