'use strict';

let fs      = require('fs');
let https   = require('https');

function file (url, path, opts) {
  let tmpPath = path + '.tmp';
  return new Promise(function (fulfill, reject) {
    https.get(url, function (res) {
      if (res.statusCode > 200 || res.statusCode >= 300) return reject(new Error(res.body));
      res.pipe(fs.createWriteStream(tmpPath, opts));
      res.on('end', fulfill);
    });
  })
  .then(() => fs.renameSync(tmpPath, path));
}

module.exports = {
  file,
};
