import heredoc from 'tsheredoc'

export function endpointStables() {
  return {
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
}

export function endpointWildcard() {
  return {
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
}

export function endpointWildcardBug() {
  return {
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
}

export function endpointAcm() {
  return {
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
}

export function endpointUntrusted() {
  return {
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
}

export function endpointTrusted() {
  return {
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
}

export function endpointWithDomains() {
  return {
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
}

export function certificateDetails() {
  return heredoc(`
    Common Name(s): example.org
    Expires At:     2013-08-01 21:34 UTC
    Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
    Starts At:      2012-08-01 21:34 UTC
    Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
    SSL certificate is self signed.
  `)
}

export function endpoint() {
  return {
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
}
