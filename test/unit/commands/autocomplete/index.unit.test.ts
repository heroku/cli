/* eslint-disable mocha/no-top-level-hooks */
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

// autocomplete will throw error on windows
import {default as runtest} from '../../../helpers/autocomplete/runtest.js'

runtest('autocomplete:index', () => {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })
  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('provides bash instructions', async function () {
    api
      .get('/apps')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
      .get('/pipelines')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
      .get('/spaces')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
      .get('/teams')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])

    const {stdout} = await runCommand(['autocomplete', 'bash'])

    expect(stdout).to.contain(`
Setup Instructions for HEROKU CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile and source it
 $ printf "$(heroku autocomplete:script bash)" >> ~/.bashrc; source ~/.bashrc 

NOTE: If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.

2) Test it out, e.g.:
 $ heroku <TAB><TAB>                  # Command completion
 $ heroku apps:info --<TAB><TAB>      # Flag completion
 $ heroku apps:info --app=<TAB><TAB>  # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!

`,
    )
  })

  it('provides zsh instructions', async function () {
    api
      .get('/apps')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
      .get('/pipelines')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
      .get('/spaces')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])
      .get('/teams')
      .reply(200, [{name: 'foo'}, {name: 'bar'}])

    const {stdout} = await runCommand(['autocomplete', 'zsh'])

    expect(stdout).to.contain(`
Setup Instructions for HEROKU CLI Autocomplete ---

1) Add the autocomplete env var to your zsh profile and source it
 $ printf "$(heroku autocomplete:script zsh)" >> ~/.zshrc; source ~/.zshrc 

NOTE: After sourcing, you can run \` $ compaudit -D \` to ensure no permissions conflicts are present

2) Test it out, e.g.:
 $ heroku <TAB>                  # Command completion
 $ heroku apps:info --<TAB>      # Flag completion
 $ heroku apps:info --app=<TAB>  # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!

`,
    )
  })
})
