import {SniEndpoint} from '../../../src/lib/types/sni_endpoint'
import {Domain} from '../../../src/lib/types/domain'

export const endpointStables: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['foo.example.org', 'bar.example.org', 'biz.example.com'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointWildcard: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['*.example.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointWildcardBug: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['fooexample.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointAcm: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: true,
    'ca_signed?': true,
    cert_domains: ['heroku.com'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
  },
}

export const endpointUntrusted: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['example.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Untrusted/CN=untrusted.example.org',
  },
}

export const endpointTrusted: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: false,
    'ca_signed?': true,
    cert_domains: ['example.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Trusted/CN=trusted.example.org',
  },
}

export const endpointWithDomains: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: ['tokyo-1050.herokussl.com'],
  display_name: 'my-tokyo-1050',
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['example.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const certificateDetails = `
  Common Name(s): example.org
  Expires At:     2013-08-01 21:34 UTC
  Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
  Starts At:      2012-08-01 21:34 UTC
  Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
  SSL certificate is self signed.
`

export const certificateDetailsWithDomains = `
  Common Name(s): example.org
  Domain(s):      subdomain.example.com
  Expires At:     2013-08-01 21:34 UTC
  Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
  Starts At:      2012-08-01 21:34 UTC
  Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
  SSL certificate is self signed.
`
export const untrustedCertificateDetails = `
  Common Name(s): example.org
  Expires At:     2013-08-01 21:34 UTC
  Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
  Starts At:      2012-08-01 21:34 UTC
  Subject:        /C=US/ST=California/L=San Francisco/O=Untrusted/CN=untrusted.example.org
  SSL certificate is not trusted.
`
export const endpoint: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: ['456789ab-cdef-0123-4567-89abcdef0123'],
  display_name: 'my-tokyo-1050',
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['example.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpointDomain: Partial<Domain> = {
  id: '456789ab-cdef-0123-4567-89abcdef0123',
  hostname: 'tokyo-1050.herokussl.com',
  sni_endpoint: {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'tokyo-1050',
  },
}

export const endpoint2: Partial<SniEndpoint> = {
  name: 'akita-7777',
  domains: ['89abcdef-0123-4567-89ab-cdef01234567'],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['example.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org',
  },
}

export const endpoint2Domain: Partial<Domain> = {
  id: '89abcdef-0123-4567-89ab-cdef01234567',
  hostname: 'akita-7777.herokussl.com',
  sni_endpoint: {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'akita-7777',
  },
}

export const endpointCname: Partial<SniEndpoint> = {
  name: 'tokyo-1051',
  domains: ['01234567-89ab-cdef-0123-456789abcdef'],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['example-1.org'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=example-1.example.org',
  },
}

export const endpointCnameDomain: Partial<Domain> = {
  id: '01234567-89ab-cdef-0123-456789abcdef',
  hostname: 'tokyo-1050.herokussl.com',
  sni_endpoint: {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'tokyo-1051',
  },
}

export const endpointHeroku: Partial<SniEndpoint> = {
  name: 'tokyo-1050',
  domains: [],
  ssl_cert: {
    acm: false,
    'ca_signed?': false,
    cert_domains: ['tokyo-1050.herokuapp.com'],
    expires_at: '2013-08-01T21:34:23Z',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=heroku.com',
    'self_signed?': false,
    starts_at: '2012-08-01T21:34:23Z',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=tokyo-1050.herokuapp.com',
  },
}

export const endpointWarning: Endpoint = {
  name: 'warning-7777',
  cname: 'warning-7777.herokussl.com',
  ssl_cert: {
    'ca_signed?': true,
    cert_domains: ['warning.com'],
    starts_at: '2012-08-01T21:34:23Z',
    expires_at: '2013-08-01T21:34:23Z',
    issuer: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.warning.org',
    subject: '/C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.warning.org',
  },
}
