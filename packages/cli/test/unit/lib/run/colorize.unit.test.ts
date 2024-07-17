import colorize from '../../../../src/lib/run/colorize'
import {expect} from 'chai'

describe('colorize', function () {
  const colorizeTest = (type: string, input: string) => {
    return colorize(`2018-01-01T00:00:00.00+00:00 heroku[${type}]: ${input}`)
  }

  it('colorizes router logs', function () {
    const routerTest1 = colorizeTest('router', 'works with bare words at=info method=POST path="/record?start=123&end=321" host=cli-analytics.heroku.com request_id=0fb9c505-5d65-4e63-8fee-fa18da33ee47 fwd="50.233.199.252" dyno=web.1 connect=1ms service=14ms status=201 bytes=255 protocol=https')
    const routerTest2 = colorizeTest('router', 'at=error code=H12 desc="Request timeout" method=GET path=/ host=myapp.herokuapp.com request_id=8601b555-6a83-4c12-8269-97c8e32cdb22 fwd="204.204.204.204" dyno=web.1 connect= service=30000ms status=503 bytes=0 protocol=http')
    expect(routerTest1).to.equal('\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[router]:\u001B[39m \u001B[2mworks\u001B[22m \u001B[2mwith\u001B[22m \u001B[2mbare\u001B[22m \u001B[2mwords\u001B[22m \u001B[2mat=\u001B[22m\u001B[2minfo\u001B[22m \u001B[2mmethod=\u001B[22m\u001B[1m\u001B[35mPOST\u001B[39m\u001B[22m \u001B[2mpath=\u001B[22m\u001B[32m"/record?start=123&end=321"\u001B[39m \u001B[2mhost=\u001B[22m\u001B[2mcli-analytics.heroku.com\u001B[22m \u001B[2mrequest_id=\u001B[22m\u001B[2m0fb9c505-5d65-4e63-8fee-fa18da33ee47\u001B[22m \u001B[2mfwd=\u001B[22m\u001B[2m"50.233.199.252"\u001B[22m \u001B[2mdyno=\u001B[22m\u001B[36mweb.1\u001B[39m \u001B[2mconnect=\u001B[22m\u001B[92m1ms\u001B[39m \u001B[2mservice=\u001B[22m\u001B[92m14ms\u001B[39m \u001B[2mstatus=\u001B[22m\u001B[32m201\u001B[39m \u001B[2mbytes=\u001B[22m\u001B[2m255\u001B[22m \u001B[2mprotocol=\u001B[22m\u001B[2mhttps\u001B[22m')
    expect(routerTest2).to.equal('\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[router]:\u001B[39m \u001B[2mat=\u001B[22m\u001B[31merror\u001B[39m \u001B[2mcode=\u001B[22m\u001B[31m\u001B[1mH12\u001B[22m\u001B[39m \u001B[2mdesc=\u001B[22m\u001B[2m"Request\u001B[22m \u001B[2mtimeout"\u001B[22m \u001B[2mmethod=\u001B[22m\u001B[1m\u001B[35mGET\u001B[39m\u001B[22m \u001B[2mpath=\u001B[22m\u001B[32m/\u001B[39m \u001B[2mhost=\u001B[22m\u001B[2mmyapp.herokuapp.com\u001B[22m \u001B[2mrequest_id=\u001B[22m\u001B[2m8601b555-6a83-4c12-8269-97c8e32cdb22\u001B[22m \u001B[2mfwd=\u001B[22m\u001B[2m"204.204.204.204"\u001B[22m \u001B[2mdyno=\u001B[22m\u001B[36mweb.1\u001B[39m \u001B[2mconnect=\u001B[22m \u001B[2mservice=\u001B[22m\u001B[31m30000ms\u001B[39m \u001B[2mstatus=\u001B[22m\u001B[31m503\u001B[39m \u001B[2mbytes=\u001B[22m\u001B[2m0\u001B[22m \u001B[2mprotocol=\u001B[22m\u001B[2mhttp\u001B[22m')
  })

  it('colorizes run logs', function () {
    const runTest1 = colorizeTest('run', 'Stopping all processes with SIGTERM')
    const runTest2 = colorizeTest('run', 'Starting process with command `test-command` by user test user')
    const runTest3 = colorizeTest('run', 'State changed from down to up')
    const runTest4 = colorizeTest('run', 'State changed from starting to complete')
    const runTest5 = colorizeTest('run', 'Process exited with status 1')
    const runTest6 = colorizeTest('run', 'Process exited with status 0')
    expect(runTest1).to.equal('\u001B[33m2018-01-01T00:00:00.00+00:00 heroku[run]:\u001B[39m \u001B[31mStopping all processes with SIGTERM\u001B[39m')
    expect(runTest2).to.equal('\u001B[33m2018-01-01T00:00:00.00+00:00 heroku[run]:\u001B[39m Starting process with command \u001B[36m\u001B[1m`test-command`\u001B[22m\u001B[39m\u001B[32m by user test user\u001B[39m')
    expect(runTest3).to.equal('\u001B[33m2018-01-01T00:00:00.00+00:00 heroku[run]:\u001B[39m State changed from \u001B[31mdown\u001B[39m to \u001B[92mup\u001B[39m')
    expect(runTest4).to.equal('\u001B[33m2018-01-01T00:00:00.00+00:00 heroku[run]:\u001B[39m State changed from \u001B[93mstarting\u001B[39m to \u001B[92mcomplete\u001B[39m')
    expect(runTest5).to.equal('\u001B[33m2018-01-01T00:00:00.00+00:00 heroku[run]:\u001B[39m Process exited with status \u001B[31m1\u001B[39m')
    expect(runTest6).to.equal('\u001B[33m2018-01-01T00:00:00.00+00:00 heroku[run]:\u001B[39m Process exited with status \u001B[92m0\u001B[39m')
  })

  it('colorizes web logs', function () {
    const webTest1 = colorizeTest('web', 'Unidling')
    const webTest2 = colorizeTest('web', 'Restarting')
    const webTest3 = colorizeTest('web', 'Stopping all processes with SIGTERM')
    const webTest4 = colorizeTest('web', 'Starting process with command `test-command` by user test user')
    const webTest5 = colorizeTest('web', 'State changed from down to up')
    const webTest6 = colorizeTest('web', 'State changed from starting to complete')
    const webTest7 = colorizeTest('web', 'Process exited with status 1')
    const webTest8 = colorizeTest('web', 'Process exited with status 0')
    const webTest9 = colorizeTest('web', '186.141.134.146 - - [07/May/2018:22:43:54 +0000] "POST /record HTTP/1.1" 201 20 "-" "http-call/3.0.2 node-v8.7.0"')
    const webTest10 = colorizeTest('web', '2018/05/07 22:32:24 [cc1a13bb-1427-4085-a632-57095b016c94/7PUOz5O3BG-000001] "POST http://heroku-cli-auth-staging.herokuapp.com/auth HTTP/1.1" from 24.22.53.209 - 201 344B in 403.241µs')
    expect(webTest1).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m \u001B[33mUnidling\u001B[39m')
    expect(webTest2).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m \u001B[33mRestarting\u001B[39m')
    expect(webTest3).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m \u001B[31mStopping all processes with SIGTERM\u001B[39m')
    expect(webTest4).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m Starting process with command \u001B[36m\u001B[1m`test-command`\u001B[22m\u001B[39m\u001B[32m by user test user\u001B[39m')
    expect(webTest5).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m State changed from \u001B[31mdown\u001B[39m to \u001B[92mup\u001B[39m')
    expect(webTest6).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m State changed from \u001B[93mstarting\u001B[39m to \u001B[92mcomplete\u001B[39m')
    expect(webTest7).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m Process exited with status \u001B[31m1\u001B[39m')
    expect(webTest8).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m Process exited with status \u001B[92m0\u001B[39m')
    expect(webTest9).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m \u001B[2m186.141.134.146 - - [07/May/2018:22:43:54 +0000] "\u001B[22m\u001B[1m\u001B[35mPOST\u001B[39m\u001B[22m\u001B[2m \u001B[22m\u001B[32m/record\u001B[39m\u001B[2m HTTP/1.1" \u001B[22m\u001B[32m201\u001B[39m\u001B[2m 20 "-" "http-call/3.0.2 node-v8.7.0"\u001B[22m')
    expect(webTest10).to.equal('\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[web]:\u001B[39m 2018/05/07 22:32:24 [cc1a13bb-1427-4085-a632-57095b016c94/7PUOz5O3BG-000001] "\u001B[1m\u001B[35mPOST\u001B[39m\u001B[22m\u001B[32m http://heroku-cli-auth-staging.herokuapp.com/auth \u001B[39mHTTP/1.1" from 24.22.53.209 - 201 344B in 403.241µs')
  })

  it('colorizes api logs', function () {
    const apiTest1 = colorizeTest('api', 'Build succeeded')
    const apiTest2 = colorizeTest('api', 'Build failed')
    const apiTest3 = colorizeTest('api', 'Build started by user test-user')
    const apiTest4 = colorizeTest('api', 'Deploy testApp by user test-user')
    const apiTest5 = colorizeTest('api', 'Release v1 created by user test-user')
    const apiTest6 = colorizeTest('api', 'Starting process with command `test-command` by user test-user')
    expect(apiTest1).to.equal('\u001B[1m\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[api]:\u001B[39m\u001B[22m \u001B[92mBuild succeeded\u001B[39m')
    expect(apiTest2).to.equal('\u001B[1m\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[api]:\u001B[39m\u001B[22m \u001B[31mBuild failed\u001B[39m')
    expect(apiTest3).to.equal('\u001B[1m\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[api]:\u001B[39m\u001B[22m Build started by user \u001B[32mtest-user\u001B[39m')
    expect(apiTest4).to.equal('\u001B[1m\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[api]:\u001B[39m\u001B[22m Deploy \u001B[36mtestApp\u001B[39m by user \u001B[32mtest-user\u001B[39m')
    expect(apiTest5).to.equal('\u001B[1m\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[api]:\u001B[39m\u001B[22m Release \u001B[35mv1\u001B[39m created by user \u001B[32mtest-user\u001B[39m')
    expect(apiTest6).to.equal('\u001B[1m\u001B[32m2018-01-01T00:00:00.00+00:00 heroku[api]:\u001B[39m\u001B[22m Starting process with command \u001B[36m\u001B[1m`test-command`\u001B[22m\u001B[39m\u001B[32m by user test-user\u001B[39m')
  })

  it('colorizes redis logs', function () {
    const redisTest = colorizeTest('heroku-redis', 'source=testsource sample#333')
    expect(redisTest).to.equal('\u001B[1m\u001B[36m2018-01-01T00:00:00.00+00:00 heroku[heroku-redis]:\u001B[39m\u001B[22m \u001B[2msource=testsource sample#333\u001B[22m')
  })

  it('colorizes heroku-postgres logs', function () {
    const pgTest1 = colorizeTest('heroku-postgres', '[DATABASE] test-database CREATE TABLE test-table')
    const pgTest2 = colorizeTest('heroku-postgres', 'source=testsource sample#333')
    expect(pgTest1).to.contain('heroku[heroku-postgres]:\u001B[39m \u001B[2m[DATABASE] test-database \u001B[22m\u001B[35mCREATE TABLE\u001B[39m\u001B[36m test-table\u001B[39m')
    expect(pgTest2).to.contain('heroku[heroku-postgres]:\u001B[39m \u001B[2msource=testsource sample#333\u001B[22m')
  })

  it('colorizes postgres logs', function () {
    const pgTest1 = colorizeTest('postgres', '[DATABASE] test-database CREATE TABLE test-table')
    const pgTest2 = colorizeTest('postgres', 'source=testsource sample#333')
    expect(pgTest1).to.equal('\u001B[35m2018-01-01T00:00:00.00+00:00 heroku[postgres]:\u001B[39m \u001B[2m[DATABASE] test-database \u001B[22m\u001B[35mCREATE TABLE\u001B[39m\u001B[36m test-table\u001B[39m')
    expect(pgTest2).to.equal('\u001B[35m2018-01-01T00:00:00.00+00:00 heroku[postgres]:\u001B[39m \u001B[2msource=testsource sample#333\u001B[22m')
  })
})
