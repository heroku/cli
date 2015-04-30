var path = require('path');
var fse = require('fs-extra');
var uuid = require('uuid');

module.exports = {

  create: function createFixture(name) {
    var source = path.join(__dirname, 'fixtures', name);
    var dest = path.join(__dirname, 'tmp', uuid.v1());
    fse.ensureDirSync(dest);
    fse.copySync(source, dest);
    return dest;
  },

  destroy: function destroyFixtures() {
    fse.removeSync(path.join(__dirname, 'tmp'));
  }
};
