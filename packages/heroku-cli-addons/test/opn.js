'use strict';

let opn = function (url, opts, cb) {
  opn.url = url;
  cb();
};

module.exports = opn;
