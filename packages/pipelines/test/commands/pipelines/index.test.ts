import {expect, test} from '@oclif/test'

describe('pipelines', () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api =>
      api.get('/pipelines')
        .reply(200, [
          {id: '0123', name: 'Betelgeuse'},
          {id: '9876', name: 'Sirius'},
        ]),
    )
    .command(['pipelines'])
    .it('shows a list of pipelines', ctx => {
      expect(ctx.stderr).to.contain('')

      expect(ctx.stdout).to.contain('My Pipelines')
      expect(ctx.stdout).to.contain('Betelgeuse')
      expect(ctx.stdout).to.contain('Sirius')
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api =>
      api.get('/pipelines')
        .reply(200, [
          {id: '0123', name: 'Betelgeuse'},
          {id: '9876', name: 'Sirius'},
        ]),
    )
    .command(['pipelines', '--json'])
    .it('shows a list of pipelines, json formatted', ctx => {
      expect(ctx.stderr).to.contain('')

      expect(JSON.parse(ctx.stdout)).to.eql([
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])
    })
})
