import {expect, test} from '@oclif/test'
import * as Open from 'cli-ux/lib/open'

describe('pipelines:open', () => {
  const pipeline = {id: '0123', name: 'Rigel'}

  let openWasCalled = false
  let openedUrl = ''

  test
    .stdout()
    .nock('https://api.heroku.com', api =>
      api
        .get('/pipelines')
        .query({eq: {name: pipeline.name}})
        .reply(200, [pipeline])
    )
    .stub(Open, 'default', (urlToOpen: string) => {
      openWasCalled = true
      openedUrl = urlToOpen
      return Promise.resolve()
    })
    .command(['pipelines:open', pipeline.name])
    .it('opens the url', () => {
      expect(openWasCalled).to.be.true
      expect(openedUrl).to.equal('https://dashboard.heroku.com/pipelines/0123')
    })
})
