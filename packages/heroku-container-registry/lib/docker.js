var path = require('path');
var child = require('child_process');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('node-uuid');

module.exports = {
  startB2D: startB2D,
  buildImageFromTemplate: buildImageFromTemplate
};

function startB2D() {
  console.log('starting boot2docker...');
  child.execSync('boot2docker start');
  child.execSync('$(boot2docker shellinit)');
}

function buildImageFromTemplate(dir, templatePath, values) {
  var dockerfile = writeDockerfile(dir, templatePath, values);
  var imageId = buildImage(dir, dockerfile);
  fs.unlinkSync(dockerfile);
  return imageId;
}

function writeDockerfile(dir, templatePath, values) {
  console.log('creating Dockerfile...');
  var filename = `Dockerfile-${uuid.v1()}`;
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var compiled = _.template(template);
  var dockerfile = compiled(values || {});
  var filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, dockerfile, { encoding: 'utf8' });
  return filePath;
}

function buildImage(dir, dockerfile) {
  console.log('building image (this can take a while)...');
  var build = child.execSync(`docker build --force-rm --file="${dockerfile}" ${dir}`, { encoding: 'utf8' });
  var tokens = build.trim().split(' ');
  var id = tokens[tokens.length - 1];
  console.log(build);
  return id;
}
