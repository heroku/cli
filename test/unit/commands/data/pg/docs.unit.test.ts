import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DataPgDocs from '../../../../../src/commands/data/pg/docs.js'

describe('data:pg:docs', function () {
  let urlOpenerStub: SinonStub

  beforeEach(function () {
    urlOpenerStub = stub(hux, 'openUrl').resolves(true)
  })

  afterEach(function () {
    restore()
  })

  it('opens the default documentation URL', async function () {
    await runCommand(DataPgDocs, [])

    expect(urlOpenerStub.calledOnceWithExactly(
      'https://devcenter.heroku.com/categories/heroku-postgres',
      {action: 'view the documentation', browser: undefined},
    )).to.be.true
  })

  it('respects the browser flag', async function () {
    await runCommand(DataPgDocs, ['--browser', 'firefox'])

    expect(urlOpenerStub.calledOnceWithExactly(
      'https://devcenter.heroku.com/categories/heroku-postgres',
      {action: 'view the documentation', browser: 'firefox'},
    )).to.be.true
  })

  it('exits 1 when the browser launcher can\'t be started', async function () {
    urlOpenerStub.resolves(false)

    const {error} = await runCommand(DataPgDocs, [])

    expect(error?.oclif?.exit).to.equal(1)
  })
})
