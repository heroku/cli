import {expect, test} from '@oclif/test'

const MY_APP = 'myapp'

describe('apps:stacks', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.get(`/apps/${MY_APP}`)
        .reply(200, {
          name: MY_APP,
          build_stack: {name: 'cedar-14'},
          stack: {name: 'cedar-14'},
        })

      api.get('/stacks')
        .reply(200, [
          {name: 'cedar'},
          {name: 'cedar-14'},
        ])
    })
    .command(['apps:stacks', '-a', MY_APP])
    .it('show available stacks', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== ⬢ myapp Available Stacks\n\n  cedar-10\n* cedar-14\n')
      expect(stderr).to.equal('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.get(`/apps/${MY_APP}`)
        .reply(200, {
          name: MY_APP,
          build_stack: {name: 'cedar'},
          stack: {name: 'cedar-14'},
        })

      api.get('/stacks')
        .reply(200, [
          {name: 'cedar'},
          {name: 'cedar-14'},
        ])
    })
    .command(['apps:stacks', '-a', MY_APP])
    .it('show an undeployed build stack', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== ⬢ myapp Available Stacks\n\n  cedar-10 (active on next deploy)\n* cedar-14\n')
      expect(stderr).to.equal('')
    })
})
