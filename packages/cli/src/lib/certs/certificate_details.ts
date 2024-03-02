import formatDate from './format_date'
import {ux} from '@oclif/core'
import {color} from '@heroku-cli/color'

type certDisplayObject = {
  'Common Name(s)': string,
  'Expires At': string,
  Issuer: string,
  'Starts At': string,
  Subject: string,
  'Domain(s)'?: string[]
}

export type cert = {
  app: any,
  domains?: string[],
  ssl_cert: {
    cert_domains: string,
    expires_at: string,
    issuer: string,
    starts_at: string,
    subject: string,
    'ca_signed?': boolean
  }
}

export const getCertificateDetials = function (cert: cert, message = 'Certificate details:') {
  const now = new Date()
  const autoRenewsAt = new Date(cert.ssl_cert.expires_at)
  autoRenewsAt.setMonth(autoRenewsAt.getMonth() - 1)

  if (cert.app && cert.app.acm && autoRenewsAt > now) {
    ux.log(`Renewal scheduled for ${color.green(formatDate(autoRenewsAt.toString()))}.\n`)
  }

  ux.log(message)
  const tableObject:certDisplayObject = {
    'Common Name(s)': cert.ssl_cert.cert_domains,
    'Expires At': formatDate(cert.ssl_cert.expires_at),
    Issuer: cert.ssl_cert.issuer,
    'Starts At': formatDate(cert.ssl_cert.starts_at),
    Subject: cert.ssl_cert.subject,
  }

  if (cert.domains && cert.domains.length > 0) {
    tableObject['Domain(s)'] = cert.domains
  }

  ux.styledObject(tableObject)

  if (cert.ssl_cert['ca_signed?']) {
    ux.log('SSL certificate is verified by a root authority.')
  } else if (cert.ssl_cert.issuer === cert.ssl_cert.subject) {
    ux.log('SSL certificate is self signed.')
  } else {
    ux.log('SSL certificate is not trusted.')
  }
}
