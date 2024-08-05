import {expect} from '@oclif/test'
import {Config} from '@oclif/core'
import {paginateRequest} from '../../../src/lib/utils/paginator'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as nock from 'nock'

const path = require('path')
const root = path.resolve(__dirname, '../package.json')
const config = new Config({root})
const exampleAPIClient = new APIClient(config)

nock.disableNetConnect()

const requestUrl = '/apps/myapp/domains'

describe('paginator', function () {
  it('paginates through 2 requests', async function () {
    nock('https://api.heroku.com')
      .get(requestUrl)
      .reply(206, [{id: '1'}], {'next-range': 'id ..; max=200'})
      .get(requestUrl)
      .reply(200, [{id: '2'}])

    const results = await paginateRequest<Heroku.Domain>(exampleAPIClient, requestUrl, 200)
    expect(results).to.have.length(2)
    expect(results[0].id).to.equal('2')
    expect(results[1].id).to.equal('1')
  })

  it('serves single requests', async function () {
    nock('https://api.heroku.com')
      .get(requestUrl)
      .reply(200, [{id: '1'}])

    const results = await paginateRequest<Heroku.Domain>(exampleAPIClient, requestUrl, 200)
    expect(results).to.have.length(1)
    expect(results).to.not.have.length(2)
    expect(results[0].id).to.equal('1')
  })
})
