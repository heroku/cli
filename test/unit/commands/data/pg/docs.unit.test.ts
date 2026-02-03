import {expect} from 'chai'
import sinon from 'sinon'

import DataPgDocs from '../../../../../src/commands/data/pg/docs.js'
import runCommand from '../../../../../test/helpers/runCommand.js'

describe('data:pg:docs', function () {
  let urlOpenerStub: sinon.SinonStub

  beforeEach(function () {
    urlOpenerStub = sinon.stub(DataPgDocs.prototype, 'openUrl').resolves()
  })

  afterEach(function () {
    sinon.restore()
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
