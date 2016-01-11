'use strict';

let cli = require('heroku-cli-util');
let url = require('url');
let https = require('https');

function concat(stream, callback) {
  var strings = [];
  stream.on('data', function (data) {
    strings.push(data);
  });
  stream.on('end', function () {
    callback(strings.join(''));
  });
}

module.exports = function(path, parts, message) {
  let logMessage = message || 'Resolving trust chain';
  return cli.action(logMessage, {}, new Promise(function(fulfill, reject) {
    let ssl_doctor = process.env.SSL_DOCTOR_URL || 'https://ssl-doctor.herokuapp.com/';

    let post_data = parts.join('\n');

    let post_options = url.parse(ssl_doctor + path);
    post_options.method = 'POST';
    post_options.headers = {
      'content-type': 'application/octet-stream',
      'content-length': Buffer.byteLength(post_data)
    };

    let req = https.request(post_options, function(res) {
      concat(res, function(data) {
        if (res.statusCode === 200) {
          fulfill(data);
        } else {
          reject(new Error(data));
        }
      });
    });
    req.write(post_data);
    req.end();
    req.on('error', function(err) {
      reject(err);
    });
  }));
};
