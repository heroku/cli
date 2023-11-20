import {expect, test} from '@oclif/test'
import * as time from '../../../../src/lib/notifications/time'
import {unwrap} from '../../../helpers/utils/unwrap'

describe('notifications', () => {
  describe('no notifications', () => {
    describe('with app', () => {
      test
        .stdout()
        .stderr()
        .nock('https://api.heroku.com:443', api => api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'}),
        )
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, []),
        )
        .command(['notifications', '-a', 'myapp', '--read'])
        .it('warns about no read notifications', ({stdout, stderr}) => {
          expect(stdout).to.be.empty
          expect(unwrap(stderr)).to.contain(' ▸    You have no notifications on myapp.\n ▸    Run heroku notifications --all to view notifications for all\n ▸    apps.\n')
        })
    })
  })
})
