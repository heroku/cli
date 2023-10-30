import {test, expect} from '@oclif/test'

describe('apps:destroy', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.get('/apps/myapp').reply(200, {name: 'myapp'})
        .delete('/apps/myapp').reply(200)
    })
    .command(['apps:destroy', '--app', 'myapp', '--confirm', 'myapp'])
    .it('deletes the app',  ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.get('/apps/myapp').reply(200, {name: 'myapp'})
        .delete('/apps/myapp').reply(200)
    })
    .command(['apps:destroy', 'myapp', '--confirm', 'myapp'])
    .it('deletes the app via arg',  ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done\n')
    })
})
