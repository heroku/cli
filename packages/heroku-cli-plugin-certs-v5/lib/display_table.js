'use strict';

let cli         = require('heroku-cli-util');
let format_date = require('./format_date.js');

module.exports = function(certs) {
  let mapped = certs.filter(function(f) { return f.ssl_cert; }).map(function(f) {
    return {
      name:         f.name,
      cname:        f.cname,
      cert_domains: f.ssl_cert.cert_domains,
      expires_at:   f.ssl_cert.expires_at,
      ca_signed:    f.ssl_cert['ca_signed?'],
      type:         f._meta.type
    };
  });
  cli.table(mapped, {columns: [
    {label: 'Name', key: 'name'},
    {label: 'Endpoint', key: 'cname'},
    {label: 'Common Name(s)', key: 'cert_domains', format: function(f) { return f.join(', '); }},
    {label: 'Expires', key: 'expires_at', format: format_date},
    {label: 'Trusted', key: 'ca_signed', format: function(f) { return f ? 'True' : 'False'; }},
    {label: 'Type', key: 'type'}
  ]});
};


