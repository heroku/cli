import {expect, test} from '@oclif/test'

describe('info', () => {
  test
  .stdout()
  .command(['info'])
  .it('runs info', ctx => {
    expect(ctx.stdout).to.contain('info world')
  })

  test
  .stdout()
  .command(['info', '--name', 'jeff'])
  .it('runs info --name jeff', ctx => {
    expect(ctx.stdout).to.contain('info jeff')
  })
})
