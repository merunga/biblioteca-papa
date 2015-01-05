var gutil = require('gulp-util');

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
    // .replace(/['"]/, '')
    // .replace(/[^a-zA-Z0-9-]/, '')
    .replace(/\s+/, '-')
    .replace(/' '/, '-')
    .replace(/(_)$/, '')
    .replace(/^(_)/, '')
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-\ñ]+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};
