import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import formatDate from './format_date'

function type(f: Heroku.SniEndpoint) {
  if (f.ssl_cert && f.ssl_cert.acm) {
    return 'ACM'
  }

  return 'SNI'
}

export default function (certs: Heroku.SniEndpoint[]) {
  const mapped = certs.filter(function (f) {
    return f.ssl_cert
  }).map(function (f) {
    const tableContents: Record<string, string | undefined> = {
      name: f.name,
      cname: f.cname,
      expires_at: f.ssl_cert.expires_at,
      ca_signed: f.ssl_cert['ca_signed?'],
      type: type(f),
      common_names: f.ssl_cert.cert_domains.join(', '),
      display_name: f.display_name,
    }

    // If they're using ACM it's not really worth showing the number of associated domains since
    // it'll always be 1 and is entirely outside the user's control
    if (!f.ssl_cert.acm) {
      tableContents.associated_domains = (f.domains && f.domains.length > 0) ? f.domains.length : '0'
    }

    return tableContents
  })
  const columns: Record<string, Record<string, any>> = {
    name: {
      header: 'Name',
    },
  }
  if (certs.some(cert => cert.display_name)) {
    columns.display_name = {header: 'Display Name'}
  }

  if (mapped.some(row => row.cname)) {
    columns.cname = {
      header: 'Endpoint',
      get: ({cname}: {cname: string | undefined}) => cname || '(Not applicable for SNI)',
    }
  }

  columns.common_names = {header: 'Common Name(s)'}
  columns.expires_at = {
    header: 'Expires',
    get: ({expires_at}: {expires_at: string | undefined}) => expires_at === undefined ? '' : formatDate(expires_at),
  }
  columns.ca_signed = {
    header: 'Trusted',
    get: ({ca_signed}: {ca_signed: string | undefined}) => ca_signed === undefined ? '' : (ca_signed ? 'True' : 'False'),
  }
  columns.type = {header: 'Type'}

  if (certs.some(cert => !cert.ssl_cert || !cert.ssl_cert.acm)) {
    columns.associated_domains = {header: 'Domains'}
  }

  ux.table(mapped, columns)
}
