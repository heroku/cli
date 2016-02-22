'use strict';

function unwrap(str) {
  return str.replace(/\n ▸   /g, '');
}

module.exports = unwrap;
