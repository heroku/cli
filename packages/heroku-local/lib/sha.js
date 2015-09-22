'use strict';

let crypto = require('crypto');
let fs     = require('fs');

function file (path) {
  return new Promise(function (fulfill) {
    let fd   = fs.createReadStream(path);
    let hash = crypto.createHash('sha1');
    hash.setEncoding('hex');
    fd.on('end', function () {
      hash.end();
      fulfill(hash.read());
    });
    fd.pipe(hash);
  });
}

module.exports = {
  file,
};
