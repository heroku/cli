import {expect, test} from '@oclif/test'

describe('run', () => {
  test
    .stdout()
    .command(['run', '--app=heroku-run-test-app', 'echo 1 2 3'])
    .it('runs a command', async ctx => {
      expect(ctx.stdout).to.include('1 2 3\r\n')
    })

  test
    .stdout()
    .command(['run', '--app=heroku-run-test-app', 'ruby -e "puts ARGV[0]" "{"foo": "bar"} " '])
    .it('runs a command with spaces', ctx => {
      expect(ctx.stdout).to.equal('{foo: bar} \r\n')
    })

  test
    .stdout()
    .command(['run', '--app=heroku-run-test-app', 'ruby -e "puts ARGV[0]" "{"foo":"bar"}"'])
    .it('runs a command with quotes', ctx => {
      expect(ctx.stdout).to.equal('{foo:bar}\r\n')
    })

  test
    .stdout()
    .command(['run', '--app=heroku-run-test-app', '-e FOO=bar', 'env'])
    .it('runs a command with env vars', ctx => {
      expect(ctx.stdout).to.include('FOO=bar')
    })

  test
    .stdout()
    .command(['run', '--app=heroku-run-test-app', '--exit-code', 'invalid-command'])
    .exit(127)
    .it('gets 127 status for invalid command', ctx => {
      expect(ctx.stdout).to.include('invalid-command: command not found')
    })
})
