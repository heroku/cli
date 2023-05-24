// const {expect} = require('chai')
const colorize = require('../../lib/colorize')

describe('colorize', () => {
  const test = (type, input) => {
    console.log(colorize(`2018-01-01T00:00:00.00+00:00 heroku[${type}]: ${input}`))
  }

  const testColorizeRedis = (type, input) => {
    console.log(colorize(`2018-01-01T00:00:00.00+00:00 app[${type}]: ${input}`))
  }

  it('colorizes router logs', () => {
    test('router', 'works with bare words at=info method=POST path="/record?start=123&end=321" host=cli-analytics.heroku.com request_id=0fb9c505-5d65-4e63-8fee-fa18da33ee47 fwd="50.233.199.252" dyno=web.1 connect=1ms service=14ms status=201 bytes=255 protocol=https')
    test('router', 'at=error code=H12 desc="Request timeout" method=GET path=/ host=myapp.herokuapp.com request_id=8601b555-6a83-4c12-8269-97c8e32cdb22 fwd="204.204.204.204" dyno=web.1 connect= service=30000ms status=503 bytes=0 protocol=http')
    test('web.1', '186.141.134.146 - - [07/May/2018:22:43:54 +0000] "POST /record HTTP/1.1" 201 20 "-" "http-call/3.0.2 node-v8.7.0"')
    test('web.1', '2018/05/07 22:32:24 [cc1a13bb-1427-4085-a632-57095b016c94/7PUOz5O3BG-000001] "POST http://heroku-cli-auth-staging.herokuapp.com/auth HTTP/1.1" from 24.22.53.209 - 201 344B in 403.241µs')
  })

  it('colorizes additional logs', () => {
    test('postgres', 'log foo is bar and where bar is foo')
    test('heroku-postgres', 'log foo is bar and where bar is foo')
    test('heroku-postgres-test', 'log foo is bar and where bar is foo')
    test('heroku-postgres-test2', 'log foo is bar and where bar is foo')
    test('heroku-postgres-test3', 'log foo is bar and where bar is foo')
    test('heroku-postgres-test4', 'log foo is bar and where bar is foo')
  })

  it('tests various functions in colorize', () => {
    // tests status default condition
    test('router', 'at=error code=H12 desc="Request timeout" method=GET path=/ host=myapp.herokuapp.com request_id=8601b555-6a83-4c12-8269-97c8e32cdb22 fwd="204.204.204.204" dyno=web.1 connect= service=30000ms status=700 bytes=0 protocol=http')
    // tests state change colorizing
    test('web.1', 'State changed from up to down')
    test('web.1', 'State changed from up to foo')
    // tests api default colorized return
    test('api', 'foo')
    testColorizeRedis('heroku-redis', 'source=REDIS sample#normal_latency_usec=1234')
  })
})
