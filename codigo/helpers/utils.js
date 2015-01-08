var gutil = require('gulp-util');
var _ = require('lodash');

module.exports.log = function(content) {
  gutil.log(content);
};

module.exports.slugify = function(str) {
  // https://gist.github.com/mathewbyrne/1280286
  // http://foros.cristalab.com/reemplazar-tildes-y-n-con-jquery-t108615/
  return str.toString().toLowerCase()
    .replace(/[áàäâå]/, 'a')
    .replace(/[éèëê]/, 'e')
    .replace(/[íìïî]/, 'i')
    .replace(/[óòöô]/, 'o')
    .replace(/[úùüû]/, 'u')
    .replace(/[ýÿ]/, 'y')
    .replace(/[ç]/, 'c')
    .replace(/[ñ]/, 'n')
    // .replace(/['"]/, '')
    // .replace(/[^a-zA-Z0-9-]/, '')
    .replace(/\s+/, '-')
    .replace(/' '/, '-')
    .replace(/(_)$/, '')
    .replace(/^(_)/, '')
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-\']+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

var path = require('path');

module.exports.relative = function(from, to) {
  var relativePath = path.relative(path.resolve(from), path.resolve(to));

  return relativePath.replace(/\\/g, '/');
};

module.exports.isObject = function (it, options) {
  if (_.isObject(it)) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
};

module.exports.isntEmpty = function (it, options) {
  if (!_.isEmpty(it)) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
};

module.exports.firstKey = function (it) {
  if (_.keys(it).length > 0) {
    return _.keys(it)[0];
  } else {
    return undefined;
  }
};
