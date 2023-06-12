/* global beforeEach */

'use strict'
import {expect, test} from '@oclif/test'
import sinon from 'sinon'
import git from '../../../src/git'

describe('git:clone', function () {
  let gitMock: sinon.SinonMock

  beforeEach(() => {
    gitMock = sinon.mock(git)
  })

  test
    .stderr()
    .command(['git:clone'])
    .catch(error => {
      expect(error.message).to.contain('Missing required flag app')
    })
    .it('errors if no app given')

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'}),
    )
    .stub(git, 'spawn', () => gitMock)
    .stdout()
    .command(['git:clone', '--app', 'myapp'])
    .it('calls git spawn function with "clone" arg', () => {
      gitMock.expects('spawn').once().withExactArgs(['clone', '-o', 'heroku', 'https://git.heroku.com/myapp.git', 'myapp']).returns(Promise.resolve())
      gitMock.restore()
    })
})
