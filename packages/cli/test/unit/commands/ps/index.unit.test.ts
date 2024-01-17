import {expect, test} from '@oclif/test'

const strftime = require('strftime')
const hourAgo = new Date(Date.now() - (60 * 60 * 1000))
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)

// function stubAccountQuota(code: number, body: Record<string, string | number | [] | [Record<string, string | number>]>) {
//   nock('https://api.heroku.com:443')
//     .get('/account/features/free-2016')
//     .reply(200, {enabled: true})
//   nock('https://api.heroku.com:443')
//     .get('/apps/myapp/dynos')
//     .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
//   nock('https://api.heroku.com:443', {
//     reqHeaders: {Accept: 'application/vnd.heroku+json; version=3.process_tier'},
//   })
//     .get('/apps/myapp')
//     .reply(200, {process_tier: 'eco', owner: {id: '1234'}, id: '6789'})
//   nock('https://api.heroku.com:443')
//     .get('/account')
//     .reply(200, {id: '1234'})
//   nock('https://api.heroku.com:443', {
//     reqHeaders: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'},
//   })
//     .get('/accounts/1234/actions/get-quota')
//     .reply(code, body)
// }

// function stubAppAndAccount() {
//   return test
//     .nock('https://api.heroku.com:443', api => api
//       .get('/apps/myapp')
//       .reply(200, {process_tier: 'basic', owner: {id: '1234'}})
//       .get('/account')
//       .reply(200, {id: '1234'}),
//     )
// }

describe('ps', async () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp')
      .reply(200, {process_tier: 'basic', owner: {id: '1234'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'},
      ]))
    .command(['ps', '--app', 'myapp'])
    .it('shows dyno list', function ({stderr, stdout}) {
      expect(stdout).to.contain(`=== run: one-off processes (1)\n\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n=== web (Eco): npm start (1)\n\nweb.1: up ${hourAgoStr} (~ 1h ago)\n\n`)
      expect(stderr).to.be.empty
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp')
      .reply(200, {space: {shield: true}, process_tier: 'basic', owner: {id: '1234'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Private-L', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'},
      ]))
    .command(['ps', '--app', 'myapp'])
    .it('shows shield dynos in dyno list for apps in a shielded private space', function ({stderr, stdout}) {
      expect(stdout).to.contain(`=== run: one-off processes (1)\n\nrun.1 (Shield-L): up ${hourAgoStr} (~ 1h ago): bash\n\n=== web (Shield-M): npm start (1)\n\nweb.1: up ${hourAgoStr} (~ 1h ago)\n\n`)
      expect(stderr).to.be.empty
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp')
      .reply(200, {process_tier: 'basic', owner: {id: '1234'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'},
      ]))
    .command(['ps', '--app', 'myapp', 'foo'])
    .catch((error: any) => {
      expect(error.message).to.equal('No \u001B[36mfoo\u001B[39m dynos on \u001B[35mmyapp\u001B[39m')
    })
    .it('errors when no dynos found')

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp')
      .reply(200, {process_tier: 'basic', owner: {id: '1234'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
      ]))
    .command(['ps', '--app', 'myapp', '--json'])
    .it('shows dyno list as json', function ({stderr, stdout}) {
      expect(stdout).to.contain('"command": "npm start"')
      expect(stderr).to.be.empty
    })

  // test
  //   .stderr()
  //   .stdout()
  //   .nock('https://api.heroku.com:443', api => api
  //     .get('/apps/myapp')
  //     .reply(200, {process_tier: 'basic', owner: {id: '1234'}})
  //     .get('/account')
  //     .reply(200, {id: '1234'})
  //     .get('/apps/myapp/dynos?extended=true')
  //     .reply(200, [
  //       {id: 100, command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route'}},
  //       {id: 101, command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route'}},
  //     ]))
  //   .command(['ps', '--app', 'myapp', '--extended'])
  //   .it('shows extended info', function ({stderr, stdout}) {
  //     expect(stdout).to.equal('')
  //     expect(stderr).to.be.empty
  //   })

  // it('shows extended info', function () {
  //   const api = nock('https://api.heroku.com:443')
  //     .get('/account')
  //     .reply(200, {id: '1234'})
  //     .get('/apps/myapp')
  //     .reply(200, {name: 'myapp'})
  //     .get('/apps/myapp/dynos?extended=true')
  //     .reply(200, [
  //       {id: 100, command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route'}}, {id: 101, command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route'}},
  //     ])
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(`ID   Process  State                                    Region  Execution Plane  Fleet  Instance  IP        Port  AZ       Release  Command    Route     Size\n\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\n101  run.1    up ${hourAgoStr} (~ 1h ago)  us      execution_plane  fleet  instance  10.0.0.2  8000  us-east           bash       da route  Eco\n100  web.1    up ${hourAgoStr} (~ 1h ago)  us      execution_plane  fleet  instance  10.0.0.1  8000  us-east           npm start  da route  Eco\n`))
  //     .then(() => expect(stderr.output, 'to be empty'))
  //     .then(() => api.done())
  // })
  // it('shows shield dynos in extended info if app is in a shielded private space', function () {
  //   const api = nock('https://api.heroku.com:443')
  //     .get('/account')
  //     .reply(200, {id: '1234'})
  //     .get('/apps/myapp')
  //     .reply(200, {space: {shield: true}})
  //     .get('/apps/myapp/dynos?extended=true')
  //     .reply(200, [
  //       {id: 100, command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route'}}, {id: 101, command: 'bash', size: 'Private-L', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route'}},
  //     ])
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(`ID   Process  State                                    Region  Execution Plane  Fleet  Instance  IP        Port  AZ       Release  Command    Route     Size\n\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n101  run.1    up ${hourAgoStr} (~ 1h ago)  us      execution_plane  fleet  instance  10.0.0.2  8000  us-east           bash       da route  Shield-L\n100  web.1    up ${hourAgoStr} (~ 1h ago)  us      execution_plane  fleet  instance  10.0.0.1  8000  us-east           npm start  da route  Shield-M\n`))
  //     .then(() => expect(stderr.output, 'to be empty'))
  //     .then(() => api.done())
  // })
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp/dynos')
      .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
      .get('/apps/myapp')
      .reply(200, {process_tier: 'eco', owner: {id: '1234'}, id: '6789'})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/accounts/1234/actions/get-quota')
      .reply(200, {account_quota: 1000, quota_used: 1, apps: []}),
    )
    .command(['ps', '--app', 'myapp'])
    .it('shows eco quota remaining', function ({stderr, stdout}) {
      const ecoExpression = `Eco dyno hours quota remaining this month: 0h 16m (99%)\nEco dyno usage for this app: 0h 0m (0%)\nFor more information on Eco dyno hours, see:\nhttps://devcenter.heroku.com/articles/eco-dyno-hours\n\n=== run: one-off processes (1)\n\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
      expect(stdout).to.contain(ecoExpression)
      expect(stderr).to.be.empty
    })

  // it('shows eco quota remaining in hours and minutes', function () {
  //   stubAccountQuota(200, {account_quota: 3600000, quota_used: 178200, apps: []})
  //   const ecoExpression = `Eco dyno hours quota remaining this month: 950h 30m (95%)\nEco dyno usage for this app: 0h 0m (0%)\nFor more information on Eco dyno hours, see:\nhttps://devcenter.heroku.com/articles/eco-dyno-hours\n\n=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  // })
  // it('shows eco quota usage of eco apps', function () {
  //   stubAccountQuota(200, {account_quota: 3600000, quota_used: 178200, apps: [{app_uuid: '6789', quota_used: 178200}]})
  //   const ecoExpression = `Eco dyno hours quota remaining this month: 950h 30m (95%)\nEco dyno usage for this app: 49h 30m (4%)\nFor more information on Eco dyno hours, see:\nhttps://devcenter.heroku.com/articles/eco-dyno-hours\n\n=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  // })
  // it('shows eco quota remaining even when account_quota is zero', function () {
  //   stubAccountQuota(200, {account_quota: 0, quota_used: 0, apps: []})
  //   const ecoExpression = `Eco dyno hours quota remaining this month: 0h 0m (0%)\nEco dyno usage for this app: 0h 0m (0%)\nFor more information on Eco dyno hours, see:\nhttps://devcenter.heroku.com/articles/eco-dyno-hours\n\n=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  // })
  // it('handles quota 404 properly', function () {
  //   stubAccountQuota(404, {id: 'not_found'})
  //   const ecoExpression = `=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  // })
  // it('handles quota 200 not_found properly', function () {
  //   stubAccountQuota(200, {id: 'not_found'})
  //   const ecoExpression = `=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  // })
  // it('does not print out for apps that are not owned', function () {
  //   nock('https://api.heroku.com:443')
  //     .get('/account')
  //     .reply(200, {id: '1234'})
  //   nock('https://api.heroku.com:443', {
  //     reqHeaders: {Accept: 'application/vnd.heroku+json; version=3.process_tier'},
  //   })
  //     .get('/apps/myapp')
  //     .reply(200, {
  //       process_tier: 'eco', owner: {id: '5678'},
  //     })
  //   nock('https://api.heroku.com:443', {
  //     reqHeaders: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'},
  //   })
  //     .get('/accounts/1234/actions/get-quota')
  //     .reply(200, {account_quota: 1000, quota_used: 1, apps: []})
  //   const dynos = nock('https://api.heroku.com:443')
  //     .get('/apps/myapp/dynos')
  //     .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
  //   const ecoExpression = `=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  //     .then(() => dynos.done())
  // })
  // it('does not print out for non-eco apps', function () {
  //   nock('https://api.heroku.com:443')
  //     .get('/account')
  //     .reply(200, {id: '1234'})
  //   nock('https://api.heroku.com:443', {
  //     reqHeaders: {Accept: 'application/vnd.heroku+json; version=3.process_tier'},
  //   })
  //     .get('/apps/myapp')
  //     .reply(200, {process_tier: 'eco', owner: {id: 1234}})
  //   const dynos = nock('https://api.heroku.com:443')
  //     .get('/apps/myapp/dynos')
  //     .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
  //   const ecoExpression = `=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  //     .then(() => dynos.done())
  // })
  // it('traps errors properly', function () {
  //   stubAccountQuota(503, {id: 'server_error'})
  //   const ecoExpression = `=== run: one-off processes (1)\nrun.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash\n\n`
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal(ecoExpression))
  //     .then(() => expect(stderr.output, 'to be empty'))
  // })
  // it('logs to stdout and exits zero when no dynos', function () {
  //   const dynos = nock('https://api.heroku.com:443')
  //     .get('/apps/myapp/dynos')
  //     .reply(200, [])
  //   stubAppAndAccount()
  //   return runCommand(Cmd, [
  //     '--app',
  //     'myapp',
  //   ])
  //     .then(() => expect(stdout.output).to.equal('No dynos on myapp\n'))
  //     .then(() => expect(stderr.output, 'to be empty'))
  //     .then(() => dynos.done())
  // })
})
