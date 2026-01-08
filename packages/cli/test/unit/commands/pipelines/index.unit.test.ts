import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('pipelines', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows a list of pipelines', async function () {
    nock('https://api.heroku.com')
      .get('/pipelines')
      .reply(200, [
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])

    const {stdout, stderr} = await runCommand(['pipelines'])

    expect(stderr).to.contain('')
    expect(stdout).to.contain('My Pipelines')
    expect(stdout).to.contain('Betelgeuse')
    expect(stdout).to.contain('Sirius')
  })

  it('shows a list of pipelines, json formatted', async function () {
    nock('https://api.heroku.com')
      .get('/pipelines')
      .reply(200, [
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])

    const {stdout, stderr} = await runCommand(['pipelines', '--json'])

    expect(stderr).to.contain('')
    expect(JSON.parse(stdout)).to.eql([
      {id: '0123', name: 'Betelgeuse'},
      {id: '9876', name: 'Sirius'},
    ])
  })
})
