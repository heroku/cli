import {ux} from '@oclif/core'
import formatDate from './format_date'
import {SniEndpoint} from '../types/sni_endpoint'

function type(endpoint: SniEndpoint) {
  if (endpoint.ssl_cert && endpoint.ssl_cert.acm) {
    return 'ACM'
  }

  return 'SNI'
}

export default function (endpoints: SniEndpoint[]) {
  const mapped = endpoints
    .filter(endpoint => endpoint.ssl_cert)
    .map(endpoint => {
      const tableContents: Record<string, unknown> = {
        name: endpoint.name,
        expires_at: endpoint.ssl_cert.expires_at,
        ca_signed: endpoint.ssl_cert['ca_signed?'],
        type: type(endpoint),
        common_names: endpoint.ssl_cert.cert_domains.join(', '),
        display_name: endpoint.display_name,
      }

      // If they're using ACM it's not really worth showing the number of associated domains since
      // it'll always be 1 and is entirely outside the user's control
      if (!endpoint.ssl_cert.acm) {
        tableContents.associated_domains = endpoint.domains.length > 0 ? endpoint.domains.length : '0'
      }

      return tableContents
    })

  const columns: Record<string, Record<string, unknown>> = {
    name: {header: 'Name'},
  }

  if (endpoints.some(endpoint => endpoint.display_name)) {
    columns.display_name = {header: 'Display Name'}
  }

  columns.common_names = {header: 'Common Name(s)'}
  columns.expires_at = {
    header: 'Expires',
    get: ({expires_at}: {expires_at: string | undefined}) => expires_at === undefined ? '' : formatDate(expires_at),
  }
  columns.ca_signed = {
    header: 'Trusted',
    get: ({ca_signed}: {ca_signed: boolean}) => ca_signed ? 'True' : 'False',
  }
  columns.type = {header: 'Type'}

  if (endpoints.some(endpoint => !endpoint.ssl_cert.acm)) {
    columns.associated_domains = {header: 'Domains'}
  }

  ux.table(mapped, columns)
}
