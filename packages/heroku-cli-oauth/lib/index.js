'use strict';

let url = require('url');

function insecureURL (uri) {
  if (uri.protocol === "https:") return false;
  // allow localhost, 10.* and 192.* clients for testing
  if (uri.host === "localhost") return false;
  if (/\.local$/.test(uri.host)) return false;
  if (uri.host.match(/^(10\.|192\.)/)) return false;
  return true;
}

function validateURL (uri) {
  let u = url.parse(uri);
  if (!u.protocol) throw new Error('Invalid URL');
  if (insecureURL(u)) throw new Error("Unsupported callback URL. Clients have to use HTTPS.");
}

module.exports = {
  validateURL,
};
