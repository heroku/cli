import {expect, test} from '@oclif/test'
import {ux} from '@oclif/core'

const API_HOST = 'https://api.heroku.com'
const APP_NAME = 'wubalubadubdub'

const CURRENT = {
  id: '00000000-0000-0000-0000-000000000002',
  version: 23,
}

const PREVIOUS = {
  id: '00000000-0000-0000-0000-000000000001',
  version: 22,
}

const withRelease = test
  .nock(API_HOST, api => api
    .get(`/apps/${APP_NAME}/releases`)
    .reply(200, [CURRENT]),
  )

describe('heroku ps:wait', function () {
  test
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/releases`)
      .reply(200, []),
    )
    .stderr()
    .command(['ps:wait', '--app', APP_NAME])
    .it('warns and exits 0 if no releases', ctx => {
      expect(ctx.stderr).to.include(`Warning: App ${APP_NAME} has no releases`)
    })

  withRelease
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
      ]),
    )
    .command(['ps:wait', '--app', APP_NAME])
    .it('exits with no output if app is already on the latest release', ctx => {
      expect(ctx.stderr).to.be.empty
    })

  withRelease
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: PREVIOUS, state: 'up', type: 'web'},
        {release: CURRENT, state: 'up', type: 'web'},
      ])
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'starting', type: 'web'},
        {release: CURRENT, state: 'up', type: 'web'},
      ])
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: CURRENT, state: 'up', type: 'web'},
      ]),
    )
    .stub(ux, 'wait', () => () => {})
    .command(['ps:wait', '--app', APP_NAME])
    .it('waits for all dynos to be on latest release', ctx => {
      expect(ctx.stderr).to.contain('Waiting for every dyno to be running v23... 2 / 2, done')
    })

  withRelease
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: PREVIOUS, state: 'up', type: 'release'},
      ]),
    )
    .command(['ps:wait', '--app', APP_NAME])
    .it('ignores release process dynos', ctx => {
      expect(ctx.stderr).to.be.empty
    })

  withRelease
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: PREVIOUS, state: 'up', type: 'run'},
      ]),
    )
    .command(['ps:wait', '--app', APP_NAME])
    .it('ignores run dynos by default', ctx => {
      expect(ctx.stderr).to.be.empty
    })

  withRelease
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: PREVIOUS, state: 'up', type: 'run'},
      ])
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'web'},
        {release: CURRENT, state: 'up', type: 'run'},
      ]),
    )
    .stub(ux, 'wait', () => () => {})
    .command(['ps:wait', '--with-run', '--app', APP_NAME])
    .it('includes run dynos with the --with-run flag', ctx => {
      expect(ctx.stderr).to.contain('Waiting for every dyno to be running v23... 2 / 2, done')
    })

  withRelease
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/dynos`)
      .reply(200, [
        {release: CURRENT, state: 'up', type: 'worker'},
        {release: PREVIOUS, state: 'up', type: 'web'},
      ]),
    )
    .command(['ps:wait', '--type=worker', '--app', APP_NAME])
    .it('waits only for dynos of specific type with the --type flag', ctx => {
      expect(ctx.stderr).to.be.empty
    })
})
