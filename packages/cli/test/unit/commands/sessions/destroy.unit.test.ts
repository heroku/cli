import {expect, test} from '@oclif/test'

describe('sessions:destroy', function () {
  test
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api
        .delete('/oauth/sessions/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
        .reply(200)
    })
    .command(['sessions:destroy', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'])
    .it('destroys the session', ctx => {
      expect(ctx.stderr).to.contain(
        'Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done',
      )
    })
})
