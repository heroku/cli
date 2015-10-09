'use strict';

let https = require('https');

function getJson (options) {
  return new Promise(function (fulfill, reject) {
    https.request(options, function (rsp) {
      let body = '';
      rsp.on('data', d => body += d);
      rsp.on('end', function () {
        if (rsp.statusCode >= 400) reject(body);
        else fulfill(JSON.parse(body));
      });
      rsp.on('error', reject);
    }).on('error', reject)
    .end();
  });
}

module.exports = {
  getJson,
};
