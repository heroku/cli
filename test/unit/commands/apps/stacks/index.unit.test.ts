import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const MY_APP = 'myapp'

describe('apps:stacks', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('show available stacks', async function () {
    api
      .get(`/apps/${MY_APP}`)
      .reply(200, {
        build_stack: {name: 'cedar-14'},
        name: MY_APP,
        stack: {name: 'cedar-14'},
      })
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ])

    const {stderr, stdout} = await runCommand(['apps:stacks', '-a', MY_APP])

    expect(stdout).to.equal('=== ⬢ myapp Available Stacks\n\n  cedar-10\n* cedar-14\n')
    expect(stderr).to.equal('')
  })

  it('show an undeployed build stack', async function () {
    api
      .get(`/apps/${MY_APP}`)
      .reply(200, {
        build_stack: {name: 'cedar'},
        name: MY_APP,
        stack: {name: 'cedar-14'},
      })
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ])

    const {stderr, stdout} = await runCommand(['apps:stacks', '-a', MY_APP])

    expect(stdout).to.equal('=== ⬢ myapp Available Stacks\n\n  cedar-10 (active on next deploy)\n* cedar-14\n')
    expect(stderr).to.equal('')
  })
})
