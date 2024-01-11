import {expect, test} from '@oclif/test'

describe('sessions:index', () => {
  const exampleSession1 = {
    description: 'B Session @ 166.176.184.223',
    id: 'aBcD1234-129f-42d2-854b-dEf123abc123',
  }
  const exampleSession2 = {
    description: 'A Session @ 166.176.184.223',
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
  }

  const testWithSessions = (sessions = [exampleSession1, exampleSession2]) =>
    test
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api.get('/oauth/sessions').reply(200, sessions)
      })

  testWithSessions()
    .command(['sessions'])
    .it('lists the sessions alphabetically by description', ctx => {
      expect(ctx.stdout).to.equal(
        ' A Session @ 166.176.184.223 f6e8d969-129f-42d2-854b-c2eca9d5a42e \n' +
        ' B Session @ 166.176.184.223 aBcD1234-129f-42d2-854b-dEf123abc123 \n',
      )
    })

  context('with json flag', () => {
    testWithSessions()
      .command(['sessions', '--json'])
      .it('lists the sessions alphabetically as json', ctx => {
        const sessionJSON = JSON.parse(ctx.stdout)

        expect(sessionJSON[0]).to.eql(exampleSession2)
        expect(sessionJSON[1]).to.eql(exampleSession1)
      })
  })

  context('without sessions', () => {
    testWithSessions([])
      .command(['sessions'])
      .it('shows no sessions message', ctx => {
        expect(ctx.stdout).to.equal('No OAuth sessions.\n')
      })
  })
})
