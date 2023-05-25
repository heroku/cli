/* eslint-disable no-useless-escape */
import {expect, test} from '@oclif/test'

// autocomplete will throw error on windows
const {default: runtest} = require('../../../helpers/runtest')

runtest('autocomplete:index', () => {
  test
    .stdout()
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/apps')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/pipelines')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/spaces')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/teams')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .command(['autocomplete', 'bash'])
    .it('provides bash instructions', ctx => {
      expect(ctx.stdout).to.contain(`
Setup Instructions for HEROKU CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile and source it
$ printf \"$(heroku autocomplete:script bash)\" >> ~/.bashrc; source ~/.bashrc

NOTE: If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.

2) Test it out, e.g.:
$ heroku <TAB><TAB>                 # Command completion
$ heroku apps:info --<TAB><TAB>     # Flag completion
$ heroku apps:info --app=<TAB><TAB> # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!

`,
      )
    })

  test
    .stdout()
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/apps')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/pipelines')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/spaces')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .nock('https://api.heroku.com', (nock: any) => {
      nock
        .get('/teams')
        .reply(200, [{name: 'foo'}, {name: 'bar'}])
    })
    .command(['autocomplete', 'zsh'])
    .it('provides zsh instructions', ctx => {
      expect(ctx.stdout).to.contain(`
Setup Instructions for HEROKU CLI Autocomplete ---

1) Add the autocomplete env var to your zsh profile and source it
$ printf \"$(heroku autocomplete:script zsh)\" >> ~/.zshrc; source ~/.zshrc

NOTE: After sourcing, you can run \`$ compaudit -D\` to ensure no permissions conflicts are present

2) Test it out, e.g.:
$ heroku <TAB>                 # Command completion
$ heroku apps:info --<TAB>     # Flag completion
$ heroku apps:info --app=<TAB> # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!

`,
      )
    })
})
