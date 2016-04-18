'use strict';

exports.mkdirp = (dir, opts) => {
  let mkdirp = require('mkdirp');
  return new Promise((f, r) => mkdirp(dir, opts, err => err ? r(err) : f()));
};
