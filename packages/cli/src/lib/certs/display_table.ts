import * as Heroku from '@heroku-cli/schema'
import * as _ from 'lodash'
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
    const name = f.name
    const cname = f.name
    const tableContents: Record<string, string | undefined> = {
      name: name,
      cname: cname,
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

  if (_.find(mapped, row => row.cname)) {
    columns.cname = {
      header: 'Endpoint',
      get: ({cname}: any) => cname || '(Not applicable for SNI)',
    }
  }

  columns.common_names = {header: 'Common Name(s)'}
  columns.expires_at = {
    header: 'Expires',
    get: (f: any) => f ? formatDate(f) : '',
  }
  columns.ca_signed = {
    header: 'Trusted',
    get: (f: any) => f === undefined ? '' : (f ? 'True' : 'False'),
  }
  columns.type = {header: 'Type'}

  if (certs.some(cert => !cert.ssl_cert || !cert.ssl_cert.acm)) {
    columns.associated_domains = {header: 'Domains'}
  }

  ux.table(mapped, {columns})
}
