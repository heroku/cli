import {expect, test} from '@oclif/test'

describe('webhooks:add', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .post('/apps/example-app/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {}),
    )
    .command([
      'webhooks:add',
      '--app',
      'example-app',
      '--include',
      'foo,bar',
      '--secret',
      '1234',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
    ])
    .it('adds a specific app webhook', ctx => {
      expect(ctx.stdout.trim()).to.equal('')
      expect(ctx.stderr).to.include('Adding webhook to example-app... done')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .post('/pipelines/example-pipeline/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {}),
    )
    .command([
      'webhooks:add',
      '--pipeline',
      'example-pipeline',
      '--include',
      'foo,bar',
      '--secret',
      '1234',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
    ])
    .it('adds a specific pipeline webhook', ctx => {
      expect(ctx.stdout).to.equal('')
      expect(ctx.stderr).to.contain('Adding webhook to example-pipeline... done\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => api
      .post('/pipelines/example-pipeline/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com',
      })
      .reply(200, {}, {'heroku-webhook-secret': '1234'}),
    )
    .command([
      'webhooks:add',
      '--pipeline',
      'example-pipeline',
      '--include',
      'foo,bar',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
    ])
    .it('adds a specific pipeline webhook', ctx => {
      expect(ctx.stdout).to.contain('=== Webhooks Signing Secret')
      expect(ctx.stdout).to.contain('1234')
      expect(ctx.stderr).to.contain('Adding webhook to example-pipeline... done')
    })
})
