import {expect, test} from '@oclif/test'

describe('ci/last', () => {
  test
  .stdout()
  .command(['ci/last'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['ci/last', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
