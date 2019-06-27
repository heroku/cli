import {expect, test} from '@oclif/test'
import * as Open from 'cli-ux/lib/open'
import * as inquirer from 'inquirer'

describe('pipelines:setup', () => {
  test
    .nock('https://kolkrabbi.heroku.com', kolkrabbi =>
      kolkrabbi.get('/account/github/token').replyWithError('')
    )
    .command(['pipelines:setup'])
    .catch(error => expect(error.message).to.equal('Account not connected to GitHub.'))
    .it('errors if the user is not linked to GitHub')

  context('with an account connected to GitHub', function () {
    const archiveURL = 'https://example.com/archive.tar.gz'
    const pipeline = { id: '123-pipeline', name: 'my-pipeline' }
    const repo = { id: 123, default_branch: 'master', name: 'my-org/my-repo' }
    const kolkrabbiAccount = {github: { token: '123-abc'}}
    const prodApp = { id: '123-prod-app', name: pipeline.name }
    const stagingApp = { id: '123-staging-app', name: `${pipeline.name}-staging` }

    function setupApiNock(api: any) {
      api
        .post('/pipelines').reply(201, pipeline)
        .get('/users/~').reply(200, { id: '1234-567' })

      const couplings = [
        {id: 1, stage: 'production', app: prodApp},
        {id: 2, stage: 'staging', app: stagingApp}
      ]

      couplings.forEach(coupling => {
        api.post('/app-setups', {
          source_blob: { url: archiveURL },
          app: { name: coupling.app.name, personal: true },
          pipeline_coupling: { stage: coupling.stage, pipeline: pipeline.id }
        }).reply(201, { id: coupling.id, app: coupling.app })

        api.get(`/app-setups/${coupling.id}`).reply(200, { status: 'succeeded' })
      })

      return api
    }

    function setupKolkrabbiNock(kolkrabbi: any) {
      kolkrabbi
        .get('/account/github/token').reply(200, kolkrabbiAccount)
        .get(`/github/repos/${repo.name}/tarball/${repo.default_branch}`).reply(200, {
          archive_link: archiveURL
        })
        .post(`/pipelines/${pipeline.id}/repository`).reply(201, {})
        .patch(`/apps/${stagingApp.id}/github`).reply(200, {})

      return kolkrabbi
    }

    context('when pipeline name is too long', function () {
      test
        .command(['pipelines:setup', 'super-cali-fragilistic-expialidocious'])
        .catch(error => expect(error.message).to.equal('Please choose a pipeline name between 2 and 22 characters long'))
        .it('shows a warning')
    })

    context('and pipeline name is valid', function () {
      context('in a personal account', function () {
        test
          .stderr()
          .stdout()
          .nock('https://api.heroku.com', api => setupApiNock(api))
          .nock('https://api.github.com', github =>
            github.get(`/repos/${repo.name}`).reply(200, repo)
          )
          .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
            setupKolkrabbiNock(kolkrabbi)

            kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, {
              name: pipeline.name,
              repo: repo.name,
              ci: true
            }).reply(200)
          })
          .stub(inquirer, 'prompt', () => Promise.resolve({
            name: pipeline.name,
            repo: repo.name,
            ci: true
          }))
          .stub(Open, 'default', () => ({open: () => Promise.resolve()}))
          .command(['pipelines:setup'])
          .it('creates apps in the personal account with CI enabled')

        test
          .stderr()
          .stdout()
          .nock('https://api.heroku.com', api => setupApiNock(api))
          .nock('https://api.github.com', github =>
            github.get(`/repos/${repo.name}`).reply(200, repo)
          )
          .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
            setupKolkrabbiNock(kolkrabbi)

            kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, {
              name: pipeline.name,
              repo: repo.name,
              ci: true
            }).reply(200)
          })
          .stub(inquirer, 'prompt', () => Promise.resolve({
            name: pipeline.name,
            repo: repo.name,
            ci: true
          }))
          .stub(Open, 'default', () => ({open: () => Promise.resolve()}))
          .command(['pipelines:setup', pipeline.name.toUpperCase()])
          .it('downcases capitalised pipeline names')

        test
          .stderr()
          .stdout()
          .nock('https://api.heroku.com', api => setupApiNock(api))
          .nock('https://api.github.com', github =>
            github.get(`/repos/${repo.name}`).reply(200, repo)
          )
          .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
            setupKolkrabbiNock(kolkrabbi)

            kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, {
              ci: true
            }).reply(200)
          })
          .stub(inquirer, 'prompt', (questions: any) => {
            // the only calls to prompt with the `yes` flag should
            // be passed over due to the `when` on the question
            // being false
            const allQuestionsPassed = questions.every((question: any) => question.when() === false)
            expect(allQuestionsPassed).to.be.true

            return Promise.resolve({})
          })
          .stub(Open, 'default', () => ({open: () => Promise.resolve()}))
          .command(['pipelines:setup', '--yes', pipeline.name, repo.name])
          .it('does not prompt for options with the -y flag')
      })

      context('in a team', function() {
        const team = 'test-org'

        test
          .nock('https://api.heroku.com', api => {
            api
              .post('/pipelines').reply(201, pipeline)

            const couplings = [
              { id: 1, stage: 'production', app: prodApp },
              { id: 2, stage: 'staging', app: stagingApp }
            ]

            couplings.forEach(function (coupling) {
              api.post('/app-setups', {
                source_blob: { url: archiveURL },
                app: { name: coupling.app.name, organization: team },
                pipeline_coupling: { stage: coupling.stage, pipeline: pipeline.id }
              }).reply(201, { id: coupling.id, app: coupling.app })

              api.get(`/app-setups/${coupling.id}`).reply(200, { status: 'succeeded' })
            })

            api.get('/teams/test-org').reply(200, { id: '89-0123-456' })
          })
          .nock('https://api.github.com', github =>
            github.get(`/repos/${repo.name}`).reply(200, repo)
          )
          .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
            setupKolkrabbiNock(kolkrabbi)

            kolkrabbi.patch(`/pipelines/${pipeline.id}/repository`, {
              name: pipeline.name,
              repo: repo.name,
              organization: team,
              ci: true
            }).reply(200)
          })
          .stub(inquirer, 'prompt', () => Promise.resolve({
            name: pipeline.name,
            repo: repo.name,
            ci: true
          }))
          .stub(Open, 'default', () => ({open: () => Promise.resolve()}))
          .command(['pipelines:setup', '--team', team])
          .it('creates apps in a team with CI enabled')
      })
    })

    // function setupKolkrabbiNock(kolkrabbi: any) {
    //   const archiveURL = 'https://example.com/archive.tar.gz'
    //   const prodApp = { id: '123-prod-app', name: pipeline.name }
    //   const stagingApp = { id: '123-staging-app', name: `${pipeline.name}-staging` }
    //   const couplings = [
    //     { id: 1, stage: 'production', app: prodApp },
    //     { id: 2, stage: 'staging', app: stagingApp }
    //   ]

    //   kolkrabbi
    //     .get('/account/github/token').reply(200, kolkrabbiAccount)
    //     .post(`/pipelines/${pipeline.id}/repository`).reply(201, {})
    //     .patch(`/apps/${stagingApp.id}/github`).reply(200, {})
    // }

    // .nock('https://kolkrabbi.heroku.com', (kolkrabbi: any) => {
    //   kolkrabbi.get('/account/github/token').reply(200, kolkrabbiAccount)
    // })

    // test
    //   .nock('https://kolkrabbi.heroku.com', kolkrabbi => setupKolkrabbiNock(kolkrabbi))
    //   .stub(inquirer, 'prompt', () => Promise.resolve({
    //     name: pipeline.name,
    //     repo: repo.name,
    //     ci: true
    //   }))
    //   .command(['pipelines:setup'])
    //   .catch(error => expect(error.message).to.equal('Account not connected to GitHub.'))
    //   .it('errors if the user is not linked to GitHub', (ctx) => {

    //   })
  })
})
