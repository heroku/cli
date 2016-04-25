'use strict';

let cli         = require('heroku-cli-util');
let format_date = require('./format_date.js');
let findMatch   = require('./find_match.js');

module.exports = function(certs, domains) {
  let mapped = [];
  certs.filter(function(f) { return f.ssl_cert; }).forEach(function(f) {
    let full = {
      name:         f.name,
      expires_at:   f.ssl_cert.expires_at,
      ca_signed:    f.ssl_cert['ca_signed?'],
      type:         f._meta.type
    };

    for (let i = 0; i < f.ssl_cert.cert_domains.length; i++) {
      let cert_domain = f.ssl_cert.cert_domains[i];
      let row = {
        cert_domains: cert_domain,
      };

      if (f.cname) {
        row.cname = f.cname;
      } else {
        row.cname = findMatch(cert_domain, domains);
      }

      if (i === 0) {
        row = Object.assign({}, row, full);
      }
      mapped.push(row);
    }
  });
  cli.table(mapped, {columns: [
    {label: 'Name', key: 'name'},
    {label: 'Endpoint', key: 'cname', format: function(f) { return f ? f : '(no domains match)';}},
    {label: 'Common Name(s)', key: 'cert_domains'},
    {label: 'Expires', key: 'expires_at', format: function(f) { return f ? format_date(f) : ''; }},
    {label: 'Trusted', key: 'ca_signed', format: function(f) { return f === undefined ? '' : (f ? 'True' : 'False'); }},
    {label: 'Type', key: 'type'}
  ]});
};


