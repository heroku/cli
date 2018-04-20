import {expect, test} from '@oclif/test'

describe('hello', () => {
  test
  .skip()
  .stdout()
  .command(['hello'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })
})
