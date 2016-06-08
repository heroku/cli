var isOrgApp = function (owner) {
  return (/@herokumanager\.com$/.test(owner));
};

module.exports.isOrgApp = isOrgApp;

var isValidEmail = function (email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
};

module.exports.isValidEmail = isValidEmail;

var getOwner = function(owner) {
  if (isOrgApp(owner)) {
    return owner.split('@herokumanager.com')[0];
  }
  return owner;
};

module.exports.getOwner = getOwner;
