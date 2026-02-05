import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows a list of pipelines', async function () {
    api
      .get('/pipelines')
      .reply(200, [
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])

    const {stderr, stdout} = await runCommand(['pipelines'])

    expect(stderr).to.contain('')
    expect(stdout).to.contain('My Pipelines')
    expect(stdout).to.contain('Betelgeuse')
    expect(stdout).to.contain('Sirius')
  })

  it('shows a list of pipelines, json formatted', async function () {
    api
      .get('/pipelines')
      .reply(200, [
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])

    const {stderr, stdout} = await runCommand(['pipelines', '--json'])

    expect(stderr).to.contain('')
    expect(JSON.parse(stdout)).to.eql([
      {id: '0123', name: 'Betelgeuse'},
      {id: '9876', name: 'Sirius'},
    ])
  })
})
