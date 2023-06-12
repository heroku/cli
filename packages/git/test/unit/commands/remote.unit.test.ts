'use strict'
/* global beforeEach */

import {expect, test} from '@oclif/test'
import sinon from 'sinon'
import git from '../../../src/git'

describe('git:remote', function () {
  let gitMock: sinon.SinonMock

  beforeEach(() => {
    gitMock = sinon.mock(git)
  })

  test
    .stderr()
    .command(['git:remote'])
    .catch(error => {
      expect(error.message).to.contain('Specify an app with --app')
    })
    .it('errors if no app given')

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'}),
    )
    .stub(git, 'exec', () => gitMock)
    .stdout()
    .command(['git:remote', '--app', 'myapp'])
    .it('calls git exec function with "remote" arg', ({stdout}) => {
      gitMock.expects('exec').once().withExactArgs(['remote', 'set-url', 'heroku', 'https://git.heroku.com/myapp.git']).returns(Promise.resolve())
      expect(stdout).to.contain('set git remote heroku to https://git.heroku.com/myapp.git\n')
      gitMock.restore()
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'}),
    )
    .stub(git, 'exec', () => gitMock)
    .stdout()
    .command(['git:remote', '--app', 'myapp'])
    .it('calls git exec function with "remote" arg', ({stdout}) => {
      gitMock.expects('exec').once().withExactArgs(['remote', 'add', 'heroku', 'https://git.heroku.com/myapp.git']).returns(Promise.resolve())
      expect(stdout).to.contain('set git remote heroku to https://git.heroku.com/myapp.git\n')
      gitMock.restore()
    })
})
