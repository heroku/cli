'use strict';

let fs = require('fs');
fs.readdirSync('./gulp').forEach(f => {
  if (f.endsWith('.js')) require('./gulp/'+f);
});
