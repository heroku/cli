var assert = require('chai').assert;
var clean = require('../commands/clean');

function MockDocker() {
  this.images = ['REPOSITORY                                             TAG                 IMAGE ID            CREATED             VIRTUAL SIZE'];
}

MockDocker.prototype.getAllImages = function() {

};

MockDocker.prototype.removeImage = function(image) {

};

describe('docker:clean', function() {
  describe('with 2 matching images and 2 non-matching', function() {
    var d = new MockDocker();
    var c = clean('test', d);
    d.images.push('heroku-docker-cff8002775f754412ccf20964f9d062e-start   latest              f2ec033de064        17 hours ago        1.277 GB');
    d.images.push('heroku-docker-cff8002775f754412ccf20964f9d062e         latest              bdd25cb49909        18 hours ago        1.274 GB');
    d.images.push('<none>                                                 <none>              2502c9bd278a        17 hours ago        1.277 GB');
    d.images.push('myproject_web                                          latest              07bd7423c264        2 weeks ago         1.415 GB');
    clean.run({});
    it('removes the 2 heroku-docker images', function() {
      assert.indexOf(d.removedImages, )
    });
    it('leaves the 2 other images', function() {

    });
  });
  describe('with no running docker instance', function() {

  });
  describe('with no images to clean', function() {

  });
});
