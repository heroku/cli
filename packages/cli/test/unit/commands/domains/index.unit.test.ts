import {expect, test} from '@oclif/test'
import * as inquirer from '@inquirer/prompts'
import * as sinon from 'sinon'
const readline = require('readline')

describe('domains', () => {
  const herokuOnlyDomainsResponse = [{
    acm_status: null,
    acm_status_reason: null,
    app: {
      name: 'myapp',
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    cname: null,
    created_at: '2012-01-01T12:00:00Z',
    hostname: 'myapp.herokuapp.com',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    kind: 'heroku',
    updated_at: '2012-01-01T12:00:00Z',
    status: 'pending',
  }]

  const herokuAndCustomDomainsResponse = [
    ...herokuOnlyDomainsResponse,
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        name: 'myapp',
        id: '01234567-89ab-cdef-0123-456789abcdef',
      },
      cname: 'foo.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: 'example.com',
      id: '11434567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      updated_at: '2012-01-01T12:00:00Z',
      status: 'succeeded',
    },
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        name: 'myapp',
        id: '01234567-89ab-cdef-0123-456789abcdef',
      },
      cname: 'bar.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: 'www.example.com',
      id: '11234567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      updated_at: '2012-01-01T12:00:00Z',
      status: 'succeeded',
    },
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        name: 'myapp',
        id: '01234567-89ab-cdef-0123-456789abcdef',
      },
      cname: 'buzz.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: '*.example.com',
      id: '12234567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      updated_at: '2012-01-01T12:00:00Z',
      status: 'succeeded',
    },
  ]

  const herokuDomainWithSniEndpoint = [
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        name: 'myapp',
        id: '01234567-89ab-cdef-0123-456789abcdef',
      },
      sni_endpoint: {
        id: 1,
        name: 'some haiku',
      },
      cname: 'buzz.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: '*.example.com',
      id: '12234567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      updated_at: '2012-01-01T12:00:00Z',
      status: 'succeeded',
    },
  ]

  // test
  //   .nock('https://api.heroku.com', api => api
  //     .get('/apps/myapp/domains')
  //     .reply(200, herokuOnlyDomainsResponse),
  //   )
  //   .stdout()
  //   .command(['domains', '--app', 'myapp'])
  //   .it('does not show the custom domain header if there are no custom domains', ctx => {
  //     expect(ctx.stdout).to.contain('=== myapp Heroku Domain\n\nmyapp.herokuapp.com')
  //     expect(ctx.stdout).to.contain('myapp.herokuapp.com')
  //     expect(ctx.stdout).to.not.contain('=== myapp Custom Domains')
  //   })

  // test
  //   .nock('https://api.heroku.com', api => api
  //     .get('/apps/myapp/domains')
  //     .reply(200, herokuAndCustomDomainsResponse),
  //   )
  //   .stdout()
  //   .command(['domains', '--app', 'myapp'])
  //   .it('shows a list of domains and their DNS targets when there are custom domains', ctx => {
  //     expect(ctx.stdout).to.contain('=== myapp Heroku Domain\n\nmyapp.herokuapp.com')
  //     expect(ctx.stdout).to.contain('myapp.herokuapp.com')
  //     expect(ctx.stdout).to.contain('=== myapp Custom Domains')
  //     expect(ctx.stdout).to.contain('Domain Name     DNS Record Type DNS Target')
  //     expect(ctx.stdout).to.contain('example.com     ALIAS or ANAME  foo.herokudns.com')
  //     expect(ctx.stdout).to.contain('www.example.com CNAME           bar.herokudns.com')
  //     expect(ctx.stdout).to.contain('*.example.com   CNAME           buzz.herokudns.com')
  //   })

  // test
  //   .nock('https://api.heroku.com', api => api
  //     .get('/apps/myapp/domains')
  //     .reply(200, herokuDomainWithSniEndpoint),
  //   )
  //   .stdout()
  //   .command(['domains', '--app', 'myapp'])
  //   .it('shows the SNI endpoint column when multiple sni endpoints are enabled', ctx => {
  //     expect(ctx.stdout).to.contain('Domain Name   DNS Record Type DNS Target         SNI Endpoint')
  //     expect(ctx.stdout).to.contain('*.example.com CNAME           buzz.herokudns.com some haiku')
  //   })

  describe('behavior for over 100 custom domain', () => {
    before(() => {
      // promptStub.onFirstCall().resolves()
      // process.stdin.write('HELLO')
      // process.stdin.end(() => {
      //   console.log('WE ENDED THE STREAM')
      // })
      // process.stdin.setEncoding('utf8')

      // process.stdin.on('data', chunk => {
      //   console.log(`Received ${chunk.length} bytes of data.`)
      // })
    })

    test
      .stdout({print: true})
      .stderr({print: true})
      // .stdin('n\n')
      // .stub(inquirer, 'confirm')
      // .do(ctx => {
      //   // process.stdin.end(() => {
      //   //   console.log('WE ENDED THE STREAM')
      //   // })

    //   console.log('ctx', ctx.stdout)

    //   setTimeout(() => {
    //     // process.stdin.write('n\n')
    //     console.log('something is happening here')
    //   }, 3000)

    //   process.stdin.setEncoding('utf8')

      //   process.stdin.on('data', chunk => {
      //     console.log(`Received ${chunk.length} bytes of data.`)
      //   })
      // })
      .nock('https://api.heroku.com', api => api
        .get('/apps/myapp/domains')
        .reply(200, () => {
          const domainData = {
            acm_status: null,
            acm_status_reason: null,
            app: {
              name: 'myapp',
              id: '01234567-89ab-cdef-0123-456789abcdef',
            },
            cname: null,
            created_at: '2012-01-01T12:00:00Z',
            hostname: 'example.com',
            id: '11434567-89ab-cdef-0123-456789abcdef',
            kind: 'custom',
            updated_at: '2012-01-01T12:00:00Z',
            status: 'succeeded',
          }

          return new Array(1000).fill(domainData) // eslint-disable-line unicorn/no-new-array
        }),
      )
      .command(['domains', '--app', 'myapp'])
      .skip()
      .it('shows warning message for over 100 domains', ctx => {
        // expect(ctx.stdout).to.equal('')
        // expect(ctx.stdout).to.contain('')
      })
  })
})
