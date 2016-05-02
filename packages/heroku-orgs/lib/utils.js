var isOrgApp = function (owner) {
  return (/@herokumanager\.com$/.test(owner));
};

module.exports.isOrgApp = isOrgApp;

var getOwner = function(owner) {
  if (isOrgApp(owner)) {
    return owner.split('@herokumanager.com')[0];
  }
  return owner;
};

module.exports.getOwner = getOwner;
