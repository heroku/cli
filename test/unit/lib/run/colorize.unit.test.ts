import {expect} from 'chai'

import colorize from '../../../../src/lib/run/colorize.js'

describe('colorize', function () {
  const colorizeTest = (type: string, input: string) => colorize(`2018-01-01T00:00:00.00+00:00 heroku[${type}]: ${input}`)

  // Color code constants
  const colors = {
    bgGray: '\u001B[48;5;237m',     // Background gray
    bold: '\u001B[1m',
    cyan1: '\u001B[38;2;80;211;213m', // RGB cyan
    cyan2: '\u001B[38;5;117m',      // 256-color cyan
    dim: '\u001B[38;5;248m',        // Gray/dim
    green1: '\u001B[38;5;40m',      // Bright green
    green2: '\u001B[38;5;43m',      // Another green
    magenta1: '\u001B[38;2;255;34;221m', // RGB magenta
    magenta2: '\u001B[38;5;212m',   // 256-color magenta
    red: '\u001B[38;2;255;135;135m', // RGB red
    reset: '\u001B[39m',
    resetBg: '\u001B[49m',
    resetBold: '\u001B[22m',
    white: '\u001B[38;5;255m',      // White
    yellow: '\u001B[38;5;185m',     // Yellow
  }

  it('colorizes router logs', function () {
    const routerTest1 = colorizeTest('router', 'works with bare words at=info method=POST path="/record?start=123&end=321" host=cli-analytics.heroku.com request_id=0fb9c505-5d65-4e63-8fee-fa18da33ee47 fwd="50.233.199.252" dyno=web.1 connect=1ms service=14ms status=201 bytes=255 protocol=https')
    const routerTest2 = colorizeTest('router', 'at=error code=H12 desc="Request timeout" method=GET path=/ host=myapp.herokuapp.com request_id=8601b555-6a83-4c12-8269-97c8e32cdb22 fwd="204.204.204.204" dyno=web.1 connect= service=30000ms status=503 bytes=0 protocol=http')
    expect(routerTest1).to.equal(`${colors.green1}2018-01-01T00:00:00.00+00:00 heroku[router]:${colors.reset} ${colors.dim}works${colors.reset} ${colors.dim}with${colors.reset} ${colors.dim}bare${colors.reset} ${colors.dim}words${colors.reset} ${colors.dim}at=${colors.reset}${colors.dim}info${colors.reset} ${colors.dim}method=${colors.reset}${colors.magenta1}POST${colors.reset} ${colors.dim}path=${colors.reset}${colors.green1}"/record?start=123&end=321"${colors.reset} ${colors.dim}host=${colors.reset}${colors.dim}cli-analytics.heroku.com${colors.reset} ${colors.dim}request_id=${colors.reset}${colors.dim}0fb9c505-5d65-4e63-8fee-fa18da33ee47${colors.reset} ${colors.dim}fwd=${colors.reset}${colors.dim}"50.233.199.252"${colors.reset} ${colors.dim}dyno=${colors.reset}${colors.cyan1}web.1${colors.reset} ${colors.dim}connect=${colors.reset}${colors.green1}1ms${colors.reset} ${colors.dim}service=${colors.reset}${colors.green1}14ms${colors.reset} ${colors.dim}status=${colors.reset}${colors.green1}201${colors.reset} ${colors.dim}bytes=${colors.reset}${colors.dim}255${colors.reset} ${colors.dim}protocol=${colors.reset}${colors.dim}https${colors.reset}`)
    expect(routerTest2).to.equal(`${colors.green1}2018-01-01T00:00:00.00+00:00 heroku[router]:${colors.reset} ${colors.dim}at=${colors.reset}${colors.red}error${colors.reset} ${colors.dim}code=${colors.reset}${colors.red}${colors.bold}H12${colors.resetBold}${colors.reset} ${colors.dim}desc=${colors.reset}${colors.dim}"Request${colors.reset} ${colors.dim}timeout"${colors.reset} ${colors.dim}method=${colors.reset}${colors.magenta1}GET${colors.reset} ${colors.dim}path=${colors.reset}${colors.green1}/${colors.reset} ${colors.dim}host=${colors.reset}${colors.dim}myapp.herokuapp.com${colors.reset} ${colors.dim}request_id=${colors.reset}${colors.dim}8601b555-6a83-4c12-8269-97c8e32cdb22${colors.reset} ${colors.dim}fwd=${colors.reset}${colors.dim}"204.204.204.204"${colors.reset} ${colors.dim}dyno=${colors.reset}${colors.cyan1}web.1${colors.reset} ${colors.dim}connect=${colors.reset} ${colors.dim}service=${colors.reset}${colors.red}30000ms${colors.reset} ${colors.dim}status=${colors.reset}${colors.red}503${colors.reset} ${colors.dim}bytes=${colors.reset}${colors.dim}0${colors.reset} ${colors.dim}protocol=${colors.reset}${colors.dim}http${colors.reset}`)
  })

  it('colorizes run logs', function () {
    const runTest1 = colorizeTest('run', 'Stopping all processes with SIGTERM')
    const runTest2 = colorizeTest('run', 'Starting process with command `test-command` by user test user')
    const runTest3 = colorizeTest('run', 'State changed from down to up')
    const runTest4 = colorizeTest('run', 'State changed from starting to complete')
    const runTest5 = colorizeTest('run', 'Process exited with status 1')
    const runTest6 = colorizeTest('run', 'Process exited with status 0')
    expect(runTest1).to.equal(`${colors.yellow}2018-01-01T00:00:00.00+00:00 heroku[run]:${colors.reset} ${colors.red}Stopping all processes with SIGTERM${colors.reset}`)
    expect(runTest2).to.equal(`${colors.yellow}2018-01-01T00:00:00.00+00:00 heroku[run]:${colors.reset} Starting process with command ${colors.bgGray}${colors.white}${colors.bold}\`test-command\`${colors.resetBold}${colors.reset}${colors.resetBg}${colors.green1} by user test user${colors.reset}`)
    expect(runTest3).to.equal(`${colors.yellow}2018-01-01T00:00:00.00+00:00 heroku[run]:${colors.reset} State changed from ${colors.red}down${colors.reset} to ${colors.green1}up${colors.reset}`)
    expect(runTest4).to.equal(`${colors.yellow}2018-01-01T00:00:00.00+00:00 heroku[run]:${colors.reset} State changed from ${colors.green2}starting${colors.reset} to ${colors.green1}complete${colors.reset}`)
    expect(runTest5).to.equal(`${colors.yellow}2018-01-01T00:00:00.00+00:00 heroku[run]:${colors.reset} Process exited with status ${colors.red}1${colors.reset}`)
    expect(runTest6).to.equal(`${colors.yellow}2018-01-01T00:00:00.00+00:00 heroku[run]:${colors.reset} Process exited with status ${colors.green1}0${colors.reset}`)
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
    expect(webTest1).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} ${colors.yellow}Unidling${colors.reset}`)
    expect(webTest2).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} ${colors.yellow}Restarting${colors.reset}`)
    expect(webTest3).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} ${colors.red}Stopping all processes with SIGTERM${colors.reset}`)
    expect(webTest4).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} Starting process with command ${colors.bgGray}${colors.white}${colors.bold}\`test-command\`${colors.resetBold}${colors.reset}${colors.resetBg}${colors.green1} by user test user${colors.reset}`)
    expect(webTest5).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} State changed from ${colors.red}down${colors.reset} to ${colors.green1}up${colors.reset}`)
    expect(webTest6).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} State changed from ${colors.green2}starting${colors.reset} to ${colors.green1}complete${colors.reset}`)
    expect(webTest7).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} Process exited with status ${colors.red}1${colors.reset}`)
    expect(webTest8).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} Process exited with status ${colors.green1}0${colors.reset}`)
    expect(webTest9).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} ${colors.dim}186.141.134.146 - - [07/May/2018:22:43:54 +0000] "${colors.reset}${colors.magenta1}POST${colors.reset}${colors.dim} ${colors.reset}${colors.green1}/record${colors.reset}${colors.dim} HTTP/1.1" ${colors.reset}${colors.green1}201${colors.reset}${colors.dim} 20 "-" "http-call/3.0.2 node-v8.7.0"${colors.reset}`)
    expect(webTest10).to.equal(`${colors.cyan1}2018-01-01T00:00:00.00+00:00 heroku[web]:${colors.reset} 2018/05/07 22:32:24 [cc1a13bb-1427-4085-a632-57095b016c94/7PUOz5O3BG-000001] "${colors.magenta1}POST${colors.reset}${colors.green1} http://heroku-cli-auth-staging.herokuapp.com/auth ${colors.reset}HTTP/1.1" from 24.22.53.209 - 201 344B in 403.241µs`)
  })

  it('colorizes api logs', function () {
    const apiTest1 = colorizeTest('api', 'Build succeeded')
    const apiTest2 = colorizeTest('api', 'Build failed')
    const apiTest3 = colorizeTest('api', 'Build started by user test-user')
    const apiTest4 = colorizeTest('api', 'Deploy testApp by user test-user')
    const apiTest5 = colorizeTest('api', 'Release v1 created by user test-user')
    const apiTest6 = colorizeTest('api', 'Starting process with command `test-command` by user test-user')
    expect(apiTest1).to.equal(`${colors.green2}2018-01-01T00:00:00.00+00:00 heroku[api]:${colors.reset} ${colors.green1}Build succeeded${colors.reset}`)
    expect(apiTest2).to.equal(`${colors.green2}2018-01-01T00:00:00.00+00:00 heroku[api]:${colors.reset} ${colors.red}Build failed${colors.reset}`)
    expect(apiTest3).to.equal(`${colors.green2}2018-01-01T00:00:00.00+00:00 heroku[api]:${colors.reset} Build started by user ${colors.green1}test-user${colors.reset}`)
    expect(apiTest4).to.equal(`${colors.green2}2018-01-01T00:00:00.00+00:00 heroku[api]:${colors.reset} Deploy ${colors.cyan1}testApp${colors.reset} by user ${colors.green1}test-user${colors.reset}`)
    expect(apiTest5).to.equal(`${colors.green2}2018-01-01T00:00:00.00+00:00 heroku[api]:${colors.reset} Release ${colors.magenta1}v1${colors.reset} created by user ${colors.green1}test-user${colors.reset}`)
    expect(apiTest6).to.equal(`${colors.green2}2018-01-01T00:00:00.00+00:00 heroku[api]:${colors.reset} Starting process with command ${colors.bgGray}${colors.white}${colors.bold}\`test-command\`${colors.resetBold}${colors.reset}${colors.resetBg}${colors.green1} by user test-user${colors.reset}`)
  })

  it('colorizes redis logs', function () {
    const redisTest = colorizeTest('heroku-redis', 'source=testsource sample#333')
    expect(redisTest).to.equal(`${colors.magenta2}2018-01-01T00:00:00.00+00:00 heroku[heroku-redis]:${colors.reset} ${colors.dim}source=testsource sample#333${colors.reset}`)
  })

  it('colorizes heroku-postgres logs', function () {
    const pgTest1 = colorizeTest('heroku-postgres', '[DATABASE] test-database CREATE TABLE test-table')
    const pgTest2 = colorizeTest('heroku-postgres', 'source=testsource sample#333')
    expect(pgTest1).to.contain(`heroku[heroku-postgres]:${colors.reset} ${colors.dim}[DATABASE] test-database ${colors.reset}${colors.magenta1}CREATE TABLE${colors.reset}${colors.cyan1} test-table${colors.reset}`)
    expect(pgTest2).to.contain(`heroku[heroku-postgres]:${colors.reset} ${colors.dim}source=testsource sample#333${colors.reset}`)
  })

  it('colorizes postgres logs', function () {
    const pgTest1 = colorizeTest('postgres', '[DATABASE] test-database CREATE TABLE test-table')
    const pgTest2 = colorizeTest('postgres', 'source=testsource sample#333')
    expect(pgTest1).to.equal(`${colors.magenta1}2018-01-01T00:00:00.00+00:00 heroku[postgres]:${colors.reset} ${colors.dim}[DATABASE] test-database ${colors.reset}${colors.magenta1}CREATE TABLE${colors.reset}${colors.cyan1} test-table${colors.reset}`)
    expect(pgTest2).to.equal(`${colors.magenta1}2018-01-01T00:00:00.00+00:00 heroku[postgres]:${colors.reset} ${colors.dim}source=testsource sample#333${colors.reset}`)
  })
})
