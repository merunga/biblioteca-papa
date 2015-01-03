var gutil = require('gulp-util');

module.exports.register = function (Handlebars, options)  { 
  Handlebars.registerHelper("log", function(content) {
    gutil.log(content);
  });
};
