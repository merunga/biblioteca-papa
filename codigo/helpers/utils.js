var gutil = require('gulp-util');
var _ = require('lodash');
var path = require('path');
var humanize = require('string-humanize');

module.exports.log = function(content) {
  gutil.log(content);
};

function slugify(str) {
  // https://gist.github.com/mathewbyrne/1280286
  // http://foros.cristalab.com/reemplazar-tildes-y-n-con-jquery-t108615/
  if(str) {
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
  }
  return str;
};

module.exports.slugify = slugify;

module.exports.slugifyEach = function(str, prefix) {
  prefix = prefix || '';
  if(str) {
    return _.collect(str.split(','), function(str2) {
      return prefix + slugify(str2)
    }).join(' ');  
  }
  return str;  
};

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

module.exports.baseUrl = function(resourcePath) {
  return path.join('/', process.env.BASE_URL, resourcePath);
};

module.exports.eachInField = function(obj, field, options) {
  var context = obj[field];
  var ret = "";

  for(var i=0, j=context.length; i<j; i++) {
    ret = ret + options.fn(context[i]);
  }

  return ret;
};

module.exports.eachCollectFieldValue = function(obj, mainField, field, options) {
  var values = _.uniq(_.collect(obj[mainField], function(it) { return it[field]; }));
  var ret = "";

  for(var i=0, j=values.length; i<j; i++) {
    ret = ret + options.fn(values[i]);
  }

  return ret;
};

module.exports.concat = function(a, b, c) {
  // if (arguments.length === 0) {
  //   return "";
  // } else {
  //   return Array.prototype.slice.call(arguments).join(" ");
  // }
  return a + b + c;
};

module.exports.concatFields = function(obj, fields, sep) {
  var values = [];
  _.each(fields, function(field) {
    values.push(obj[field]);
  });
  return values.join(sep);
};

module.exports.strPad = function(str, size) {
  var s = String(str);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
};

module.exports.humanize = function(str) {
  return humanize(str);
};

module.exports.get = function(obj, field) {
  if(obj) {
    return obj[field];  
  }
};

// module.exports.extend = function(one, other) {
//   return _.extend({}, other, one);
// };

// module.exports.register = function (Handlebars, options)  { 
//   Handlebars.registerHelper('set', function (variableName, hOptions)  {
//     var self = this;
//     Handlebars.registerHelper(variableName, function ()  { 
//       return hOptions.fn(self);
//     });
//   });
// };
