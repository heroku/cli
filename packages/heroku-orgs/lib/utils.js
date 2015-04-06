var columnify   = require('columnify');

var printData = function (data) {
  console.log(columnify(data, { showHeaders: false, columnSplitter: '\t' }));
};

module.exports.printData = printData;

var isOrgApp = function (owner) {
  return (/herokumanager\.com$/.test(owner));
};

module.exports.isOrgApp = isOrgApp;

var getOwner = function(owner) {
  if (isOrgApp(owner)) {
    return owner.split('@herokumanager.com')[0];
  }
  return owner;
};

module.exports.getOwner = getOwner;
