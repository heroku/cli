import {expect, test} from '@oclif/test'

const testFactory = () => {
  return test
    .stdout()
    .do(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
      process.stdout.isTTY = false
    })
}

describe('run', function () {
  testFactory()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'echo 1 2 3'])
    .it('runs a command', async ctx => {
      expect(ctx.stdout).to.include('1 2 3')
    })

  testFactory()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo": "bar"} " '])
    .it('runs a command with spaces', ctx => {
      expect(ctx.stdout).to.contain('{foo: bar}')
    })

  testFactory()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo":"bar"}"'])
    .it('runs a command with quotes', ctx => {
      expect(ctx.stdout).to.contain('{foo:bar}')
    })

  testFactory()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '-e FOO=bar', 'env'])
    .it('runs a command with env vars', ctx => {
      expect(ctx.stdout).to.include('FOO=bar')
    })

  testFactory()
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '--exit-code', 'invalid-command'])
    .exit(127)
    .it('gets 127 status for invalid command', ctx => {
      expect(ctx.stdout).to.include('invalid-command: command not found')
    })
})
