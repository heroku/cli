'use strict';

let child_process = require('child_process');

module.exports = {
  spawn: function(args) {
    return new Promise(function (fulfill, reject) {
      let s = child_process.spawn('openssl', args, {stdio: 'inherit'});
      s.on('error', reject);
      s.on('close', function(code) {
        if (code === 0) {
          fulfill(code);
        } else {
          reject(new Error(`Non zero openssl error ${code}`));
        }
      });
    });
  }
};
