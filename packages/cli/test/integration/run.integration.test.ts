import {expect, test} from '@oclif/test'
import * as runHelper from '../../src/lib/run/helpers'
import {unwrap} from '../helpers/utils/unwrap'

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
    .stub(runHelper, 'revertSortedArgs', () => ['echo 1 2 3'])
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'echo 1 2 3'])
    .it('runs a command', async ctx => {
      expect(ctx.stdout).to.include('1 2 3')
    })

  testFactory()
    .stub(runHelper, 'revertSortedArgs', () => ['ruby -e "puts ARGV[0]" "{"foo": "bar"} " '])
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo": "bar"} " '])
    .it('runs a command with spaces', ctx => {
      expect(unwrap(ctx.stdout)).to.contain('{foo: bar}')
    })

  testFactory()
    .stub(runHelper, 'revertSortedArgs', () => ['{foo:bar}'])
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', 'ruby -e "puts ARGV[0]" "{"foo":"bar"}"'])
    .it('runs a command with quotes', ctx => {
      expect(ctx.stdout).to.contain('{foo:bar}')
    })

  testFactory()
    .stub(runHelper, 'revertSortedArgs', () => ['-e FOO=bar', 'env'])
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '-e FOO=bar', 'env'])
    .it('runs a command with env vars', ctx => {
      expect(unwrap(ctx.stdout)).to.include('FOO=bar')
    })

  testFactory()
    .stub(runHelper, 'revertSortedArgs', () => ['invalid-command command not found'])
    .command(['run', '--app=heroku-cli-ci-smoke-test-app', '--exit-code', 'invalid-command'])
    .exit(127)
    .it('gets 127 status for invalid command', ctx => {
      expect(unwrap(ctx.stdout)).to.include('invalid-command: command not found')
    })
})
