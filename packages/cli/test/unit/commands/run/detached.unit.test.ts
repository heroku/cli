import {expect, test} from '@oclif/test'

describe('detached', async () => {
  const app = 'heroku-cli-ci-smoke-test-app'
  const dyno = 'test-dyno'
  const dynoReponse = {
    name: dyno,
    state: 'starting',
    dyno: {name: dyno},
  }

  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.post(`/apps/${app}/dynos`)
        .reply(200, dynoReponse)
    })
    .command(['run:detached', `--app=${app}`, 'test'])
    .it('sucessfully runs detached', ctx => {
      const rawResponse = ctx.stdout
      const updatedDynoNameResponse = rawResponse.replace(/run\.\d{4}/g, 'test-dyno')
      expect(updatedDynoNameResponse).to.equal(`Run heroku logs --app ${app} --dyno ${dyno} to view the output.\n`)
    })

  test
    .stdout()
    .command(['run:detached', `--app=${app}`])
    .catch(error => {
      expect(error.message).to.equal('Usage: heroku run COMMAND\n\nExample: heroku run bash')
    })
    .it('errors if no arguments are provided')
})
