import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

const MY_APP = 'myapp'

describe('apps:stacks', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('show available stacks', async function () {
    nock('https://api.heroku.com:443')
      .get(`/apps/${MY_APP}`)
      .reply(200, {
        name: MY_APP,
        build_stack: {name: 'cedar-14'},
        stack: {name: 'cedar-14'},
      })
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ])

    const {stdout, stderr} = await runCommand(['apps:stacks', '-a', MY_APP])

    expect(stdout).to.equal('=== ⬢ myapp Available Stacks\n\n  cedar-10\n* cedar-14\n')
    expect(stderr).to.equal('')
  })

  it('show an undeployed build stack', async function () {
    nock('https://api.heroku.com:443')
      .get(`/apps/${MY_APP}`)
      .reply(200, {
        name: MY_APP,
        build_stack: {name: 'cedar'},
        stack: {name: 'cedar-14'},
      })
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ])

    const {stdout, stderr} = await runCommand(['apps:stacks', '-a', MY_APP])

    expect(stdout).to.equal('=== ⬢ myapp Available Stacks\n\n  cedar-10 (active on next deploy)\n* cedar-14\n')
    expect(stderr).to.equal('')
  })
})
