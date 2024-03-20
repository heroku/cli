import {stdout, stderr} from 'stdout-stderr'
import Cmd  from 'REPLACE_WITH_PATH_TO_COMMAND'
import runCommand from '../../../helpers/runCommand'
const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:delete')
const shouldDelete = function (cmdRun) {
  let pg
  beforeEach(() => {
    pg = nock('https://api.data.heroku.com')
    pg.delete('/client/v11/apps/myapp/transfers/3')
      .reply(200, {
        url: 'https://dburl',
      })
    cli.mockConsole()
  })
  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })
  it('shows URL', () => {
    return runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'b003',
    ])
      .then(() => expect(stderr.output).to.equal('Deleting backup b003 on myapp... done\n'))
  })
}

describe('pg:backups:delete', () => {
  shouldDelete(args => cmd.run(args))
})
describe('pg:backups delete', () => {
  shouldDelete(require('./helpers.js')
    .dup('delete', cmd))
})
