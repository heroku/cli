'use strict';

let gutil = require('gulp-util');
let https = require('https');

exports.get = url => {
  gutil.log(`HTTP GET ${url}`);
  return new Promise((ok, fail) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode <= 399) return ok(exports.get(res.headers.location));
      if (res.statusCode <= 199 || res.statusCode >= 400) return fail(new Error(`${res.statusCode}:${url}`));
      ok(res);
    });
  });
};
