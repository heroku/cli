import formatDate from './format_date.js'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {color} from '@heroku-cli/color'
import {SniEndpoint} from '../types/sni_endpoint.js'

export const displayCertificateDetails = function (sniEndpoint: SniEndpoint, message = 'Certificate details:') {
  const now = new Date()
  const autoRenewsAt = new Date(sniEndpoint.ssl_cert.expires_at)
  autoRenewsAt.setMonth(autoRenewsAt.getMonth() - 1)

  if (sniEndpoint.app && sniEndpoint.ssl_cert.acm && autoRenewsAt > now) {
    ux.stdout(`Renewal scheduled for ${color.green(formatDate(autoRenewsAt.toString()))}.\n`)
  }

  ux.stdout(message)
  const tableObject: Record<string, unknown> = {
    'Common Name(s)': sniEndpoint.ssl_cert.cert_domains,
    'Expires At': formatDate(sniEndpoint.ssl_cert.expires_at),
    Issuer: sniEndpoint.ssl_cert.issuer,
    'Starts At': formatDate(sniEndpoint.ssl_cert.starts_at),
    Subject: sniEndpoint.ssl_cert.subject,
  }

  // Only displays domains when the list of ids was replaced by the list of hostnames
  if (sniEndpoint.domains.length > 0 && !sniEndpoint.domains.some(domain => domain.match('^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}'))) {
    tableObject['Domain(s)'] = sniEndpoint.domains
  }

  hux.styledObject(tableObject)

  if (sniEndpoint.ssl_cert['ca_signed?']) {
    ux.stdout('SSL certificate is verified by a root authority.')
  } else if (sniEndpoint.ssl_cert.issuer === sniEndpoint.ssl_cert.subject) {
    ux.stdout('SSL certificate is self signed.')
  } else {
    ux.stdout('SSL certificate is not trusted.')
  }
}
