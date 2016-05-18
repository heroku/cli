'use strict'
/* globals describe it commands apikey */

const cmd = commands.find(c => c.topic === 'run' && !c.command)
const expect = require('unexpected')
const StdOutFixture = require('fixture-stdout')
const fixture = new StdOutFixture()

describe('run', () => {
  it('runs a command', () => {
    let stdout = ''
    fixture.capture(s => { stdout += s })
    return cmd.run({app: 'heroku-run-test-app', flags: {}, auth: {password: apikey}, args: ['echo', '1', '2', '3']})
    .then(() => fixture.release())
    .then(() => expect(stdout, 'to equal', '1 2 3\n'))
  })

  it('gets 127 status for invalid command', () => {
    return expect(cmd.run({app: 'heroku-run-test-app', flags: {'exit-code': true}, auth: {password: apikey}, args: ['invalid-command']})
                  , 'to be rejected with', 'Process exited with code 127')
  })
})
