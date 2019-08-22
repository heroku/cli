import {expect, test} from '@oclif/test'

describe('pipelines:connect', () => {
  describe('when the user is not linked to GitHub', () => {
    test
      .stderr()
      .stdout()
      .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
        kolkrabbi.get('/account/github/token').reply(401, {})
      })
      .command(['pipelines:connect', '--repo=my-repo'])
      .catch('Account not connected to GitHub.')
      .it('displays an error')
  })
})
