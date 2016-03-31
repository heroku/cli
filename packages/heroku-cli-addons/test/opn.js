'use strict';

let opn = function (url) {
  opn.url = url;
  return new Promise(ok => ok());
};

module.exports = opn;
