import {expect, test} from '@oclif/test'

describe('keys:clear', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [{id: 1}, {id: 2}])
        .delete('/account/keys/1').reply(200)
        .delete('/account/keys/2').reply(200)
    })
    .command(['keys:clear'])
    .it('removes all SSH keys', ({stdout, stderr}) => {
      expect('').to.equal(stdout)
      expect(stderr).to.contain('Removing all SSH keys... done\n')
    })
})
