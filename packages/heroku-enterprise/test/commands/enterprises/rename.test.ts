/* tslint:disable:number-literal-format */
import {expect, test} from '@oclif/test'

describe('enterprise:rename', () => {
  const accountsResponse = {id: '01234567-89ab-cdef-0123-456789abcdef'}
  const enterpriseAccountRenameResponse = {}

  test
    .stderr()
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/uglyname')
      .reply(200, accountsResponse)
      .patch('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef', {name: 'prettyname'})
      .reply(200, enterpriseAccountRenameResponse)
    )
    .command(['enterprises:rename', 'uglyname', 'prettyname'])
    .it('renames the enterprise account', ctx => {
      expect(ctx.stderr).to.contain('Renaming enterprise account from uglyname to prettyname')
    })
})
