import {expect, test} from '@oclif/test'

describe('enterprise:members', () => {
  const membersResponse = [{
    enterprise_account: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'example'
    },
    id: '01234567-89ab-cdef-0123-456789abcdef',
    permissions: [
      {
        description: 'View enterprise account members and teams.',
        name: 'view'
      },
      {
        description: 'View enterprise account billing info.',
        name: 'billing'
      }
    ],
    user: {
      email: 'roadrunner@runnersroost.com',
      id: '01234567-89ab-cdef-0123-456789abcdef'
    },
    two_factor_authentication: true,
    identity_provider: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'acme',
      redacted: false,
      owner: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'Senior Roost',
        type: 'team'
      }
    }
  }]

  test
    .stdout()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/runnersroost/members')
      .reply(200, membersResponse)
    )
    .command(['enterprise:members', '--enterprise-account', 'runnersroost'])
    .it('lists members in a enterprise account', ctx => {
      expect(ctx.stdout.trim()).to.eq(`Email                       Permissions${''.padEnd(2)}
roadrunner@runnersroost.com view,billing`)
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/runnersroost/members')
      .reply(200, [])
    )
    .command(['enterprise:members', '--enterprise-account', 'runnersroost'])
    .it('warns there are no enterprise members to list', ctx => {
      expect(ctx.stderr).to.contain('No enterprise members to list')
    })
})
