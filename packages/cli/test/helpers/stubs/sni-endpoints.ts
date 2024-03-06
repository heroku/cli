import heredoc from 'tsheredoc'

export type Endpoint = {
  name: string
  cname: string | null
  display_name?: string
  domains?: string[]
  ssl_cert: {
    'ca_signed?': boolean
    cert_domains: string[]
    starts_at: string
    expires_at: string
    issuer: string
    subject: string
    acm?: boolean
  }
}

export const endpointStables: Endpoint = {
  name: 'tokyo-1050',
  cname: null,
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['foo.example.org', 'bar.example.org', 'biz.example.com'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointWildcard: Endpoint = {
  name: 'tokyo-1050',
  cname: null,
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['*.example.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointWildcardBug: Endpoint = {
  name: 'tokyo-1050',
  cname: null,
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['fooexample.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointAcm: Endpoint = {
  name: 'tokyo-1050',
  cname: null,
  ssl_cert: {
    'ca_signed?': true,
    cert_domains: ['heroku.com'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
    acm: true,
  },
}

export const endpointUntrusted: Endpoint = {
  name: 'tokyo-1050',
  cname: 'tokyo-1050.herokussl.com',
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['example.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Untrusted/CN=untrusted.example.org',
  },
}

export const endpointTrusted: Endpoint = {
  name: 'tokyo-1050',
  cname: 'tokyo-1050.herokussl.com',
  ssl_cert: {
    'ca_signed?': true,
    cert_domains: ['example.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Trusted/CN=trusted.example.org',
  },
}

export const endpointWithDomains: Endpoint = {
  name: 'tokyo-1050',
  cname: 'tokyo-1050.herokussl.com',
  domains: ['example.heroku.com'],
  display_name: 'my-tokyo-1050',
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['example.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export function certificateDetails() {
  return `
    Common Name(s): example.org
    Expires At:     2013-08-01 21:34 UTC
    Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
    Starts At:      2012-08-01 21:34 UTC
    Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
    SSL certificate is self signed.
  `
}

export function certificateDetailsWithDomains() {
  return `
    Common Name(s): example.org
    Domain(s):      subdomain.example.com
    Expires At:     2013-08-01 21:34 UTC
    Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
    Starts At:      2012-08-01 21:34 UTC
    Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
    SSL certificate is self signed.
  `
}

export const endpoint: Endpoint = {
  name: 'tokyo-1050',
  cname: 'tokyo-1050.herokussl.com',
  display_name: 'my-tokyo-1050',
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['example.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpoint2: Endpoint = {
  name: 'akita-7777',
  cname: 'akita-7777.herokussl.com',
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['example.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointCname: Endpoint = {
  name: 'tokyo-1051',
  cname: 'tokyo-1050.herokussl.com',
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['example-1.org'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
  },
}

export const endpointHeroku: Endpoint = {
  name: 'tokyo-1050',
  cname: null,
  ssl_cert: {
    'ca_signed?': false,
    cert_domains: ['tokyo-1050.herokuapp.com'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=heroku.com',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=tokyo-1050.herokuapp.com',
  },
}
