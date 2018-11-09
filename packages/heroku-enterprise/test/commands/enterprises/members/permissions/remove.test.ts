import {expect, test} from '@oclif/test'

describe('enterprises:members:permissions:remove', () => {
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
          name: 'billing'
        },
        {
          description: 'Manage enterprise account.',
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
      .patch('/enterprise-accounts/acme/members/sally@acme.com', {permissions: ['view']})
      .reply(200)
    )
    .command(['enterprises:members:permissions:remove', 'sally@acme.com', '-e', 'acme', '--permissions', 'billing,manage'])
    .it('should remove permissions from an existing member', ctx => {
      expect(ctx.stderr).to.contain('Updating permissions for sally@acme.com from view,billing,manage to view')
    })

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/acme/members')
      .reply(200, membersGetResponse)
    )
    .command(['enterprises:members:permissions:remove', 'bob@acme.com', '-e', 'acme', '-p', 'create'])
    .catch((err: any) => expect(err.message).to.contain('\u001b[36mbob@acme.com\u001b[39m is not a member of \u001b[32macme\u001b[39m'))
    .it('should handle invalid members')
})
