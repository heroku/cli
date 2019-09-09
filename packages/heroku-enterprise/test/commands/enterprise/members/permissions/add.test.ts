import {expect, test} from '@oclif/test'

describe('enterprise:members:permissions:add', () => {
  const membersGetResponse = [
    {
      enterprise_account: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'acme'
      },
      id: '01234567-89ab-cdef-0123-456789abcdef',
      permissions: [
        {
          description: 'View enterprise account members and teams.',
          name: 'view'
        },
        {
          description: 'View enterprise account billing info.',
          name: 'manage'
        }
      ],
      user: {
        email: 'sally@acme.com',
        id: '01234567-89ab-cdef-0123-456789abcdef'
      },
      two_factor_authentication: true,
      identity_provider: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'acme',
        redacted: false,
        owner: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'Sally Swoon',
          type: 'team'
        }
      }
    }
  ]

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/acme/members')
      .reply(200, membersGetResponse)
      .patch('/enterprise-accounts/acme/members/sally@acme.com', {permissions: ['billing', 'create', 'view', 'manage']})
      .reply(200)
    )
    .command(['enterprise:members:permissions:add', 'sally@acme.com', '-e', 'acme', '--permissions', 'billing,create'])
    .it('should add additional permissions to an existing member', ctx => {
      expect(ctx.stderr).to.contain('Updating permissions for sally@acme.com from view,manage to billing,create,view,manage')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/acme/members')
      .reply(200, membersGetResponse)
      .patch('/enterprise-accounts/acme/members/sally@acme.com', {permissions: ['billing', 'create', 'view', 'manage']})
      .reply(200)
    )
    .command(['enterprise:members:permissions:add', 'sally@acme.com', '-e', 'acme', '--permissions', 'billing,create,view,manage'])
    .it('should add additional permissions to an existing member ignoring duplicates', ctx => {
      expect(ctx.stderr).to.contain('Updating permissions for sally@acme.com from view,manage to billing,create,view,manage')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/acme/members')
      .reply(200, membersGetResponse)
    )
    .command(['enterprise:members:permissions:add', 'bob@acme.com', '-e', 'acme', '-p', 'create'])
    .catch((err: any) => expect(err.message).to.contain('bob@acme.com is not a member of acme'))
    .it('should handle invalid members')
})
