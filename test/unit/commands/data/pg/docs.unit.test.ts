import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DataPgDocs from '../../../../../src/commands/data/pg/docs.js'

describe('data:pg:docs', function () {
  let urlOpenerStub: SinonStub

  beforeEach(function () {
    urlOpenerStub = stub(DataPgDocs.prototype, 'openUrl').resolves()
  })

  afterEach(function () {
    restore()
  })

  it('opens the default documentation URL', async function () {
    await runCommand(DataPgDocs, [])

    expect(urlOpenerStub.calledOnceWith(
      'https://devcenter.heroku.com/categories/heroku-postgres',
      undefined,
      'view the documentation',
    )).to.be.true
  })

  it('respects the browser flag', async function () {
    await runCommand(DataPgDocs, ['--browser', 'firefox'])

    expect(urlOpenerStub.calledOnceWith(
      'https://devcenter.heroku.com/categories/heroku-postgres',
      'firefox',
      'view the documentation',
    )).to.be.true
  })
})
