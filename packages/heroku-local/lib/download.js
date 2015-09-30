'use strict';

let fs      = require('fs');
let request = require('request');

function file (url, path, opts) {
  let tmpPath = path + '.tmp';
  return new Promise(function (fulfill, reject) {
    request(url, function (err, res) {
      if (err) return reject(err);
      if (res.statusCode > 200 || res.statusCode >= 300) return reject(new Error(res.body));
      // for some reason this seems necessary
      setTimeout(fulfill, 500);
    })
    .pipe(fs.createWriteStream(tmpPath, opts));
  })
  .then(() => fs.renameSync(tmpPath, path));
}

module.exports = {
  file,
};
