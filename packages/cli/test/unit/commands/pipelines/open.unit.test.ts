import {expect, test} from '@oclif/test'
import * as proxyquire from 'proxyquire'
import * as sinon from 'sinon'

describe('pipelines:open', () => {
  const pipeline = {id: '0123', name: 'Rigel'}

  let openWasCalled = false
  let openedUrl = ''
  const openStub = sinon.stub().callsFake((urlToOpen: string) => {
    openWasCalled = true
    openedUrl = urlToOpen
    return Promise.resolve()
  })
  proxyquire('../../../../src/commands/pipelines/open', {
    open: Object.assign(openStub, {'@global': true}),
  })

  test
    .stdout()
    .nock('https://api.heroku.com', api =>
      api
        .get('/pipelines')
        .query({eq: {name: pipeline.name}})
        .reply(200, [pipeline]),
    )
    .command(['pipelines:open', pipeline.name])
    .it('opens the url', () => {
      expect(openWasCalled).to.be.true
      expect(openedUrl).to.equal('https://dashboard.heroku.com/pipelines/0123')
    })
})
