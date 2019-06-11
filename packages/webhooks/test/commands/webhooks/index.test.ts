import { expect, test } from '@oclif/test'

describe('webhooks:index', () => {
  describe('app webhooks', () => {
    let appWebhooksUrl = '/apps/example/webhooks'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhooksUrl)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          include: ['foo', 'bar'],
          level: 'notify',
          url: 'http://foobar.com'
        }])
      )
      .command(['webhooks', '--app', 'example'])
      .it('lists webhooks', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(`Webhook ID                           URL               Include Level  
99999999-9999-9999-9999-999999999999 http://foobar.com foo,bar notify 
`)
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(appWebhooksUrl)
        .reply(200, [])
      )
      .command(['webhooks', '--app', 'example'])
      .it('displays a "no webhooks" message', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal('⬢ example has no webhooks\nUse heroku webhooks:add to add one.\n')
      })
  })

  describe('pipeline webhooks', () => {
    let pipelinesWebhooksUrl = '/pipelines/example/webhooks'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelinesWebhooksUrl)
        .reply(200, [{
          id: '99999999-9999-9999-9999-999999999999',
          include: ['foo', 'bar'],
          level: 'notify',
          url: 'http://foobar.com'
        }])
      )
      .command(['webhooks', '--pipeline', 'example'])
      .it('lists webhooks', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(`Webhook ID                           URL               Include Level  
99999999-9999-9999-9999-999999999999 http://foobar.com foo,bar notify 
`)
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => api
        .get(pipelinesWebhooksUrl)
        .reply(200, [])
      )
      .command(['webhooks', '--pipeline', 'example'])
      .it('displays a "no webhooks" message', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal('example has no webhooks\nUse heroku webhooks:add to add one.\n')
      })
  })
})
