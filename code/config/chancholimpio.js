/*!
 * Static Site Starter Kit | https://github.com/kriasoft/static-site-starter
 * Copyright (c) Konstantin Tarkus, KriaSoft LLC. All rights reserved. See COPYRIGHT.txt
 */

'use strict';

// Include Gulp and other build automation tools and utilities
// See: https://github.com/gulpjs/gulp/blob/master/docs/API.md
var del = require('del');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var path = require('path');
var _ = require('lodash');
var yaml = require('js-yaml');
var fs   = require('fs');

var defaultPaths = {
  content: {
    self: 'content',
    files: 'files/**',
    images: 'images/**',
    pages: 'pages/**/*'
  },
  code: {
    self: 'code',
    webroot: 'webroot',
    assets: {
      self: 'assets',
      images: 'images',
    },
    partials: 'partials/**/*.hbs',
    layouts: 'layouts',
    styles: {
      self: 'styles',
      src: '**/*.{css,less}',
      theme: 'theme.less'
    }
  }
};

var paths = defaultPaths;
// var paths = {
//   content: {
//     self: 'contenido',
//     files: '**/*(.pdf|.zip)'

//   }
// }


module.exports = function(gulp, rootDir, argv, $) {
  var config = {
    dest: './site'
  }

  // Settings
  var RELEASE_URL = '<URL>';
  var DEST = config.dest;             // The build output folder
  var RELEASE = !!argv.release;         // Minimize and optimize during a build?
  var BASE_URL = RELEASE? RELEASE_URL: '';
  var GOOGLE_ANALYTICS_ID = 'UA-XXXXX-X';   // https://www.google.com/analytics/web/
  var AUTOPREFIXER_BROWSERS = [         // https://github.com/ai/autoprefixer
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  var src = {};
  var watch = false;
  var reload = browserSync.reload;
  var pkgs = (function () {
    var temp = {};
    var map = function (source) {
      for (var key in source) {
        temp[key.replace(/[^a-z0-9]/gi, '')] = source[key].substring(1);
      }
    };
    map(require(path.join(rootDir,'/package.json')).dependencies);
    map(require(path.join(rootDir,'/bower.json')).dependencies);
    return temp;
  }());

  var assembleData = {
    pkgs: pkgs,
    baseUrl: BASE_URL
  };

  try {
    assembleData = _.extend(assembleData, yaml.safeLoad(fs.readFileSync(path.join(rootDir,'data.yml'), 'utf8')));
  } catch (e) {
    console.log(e);
  }

  function isntFolder(file) {
    return !file.isDirectory();
  }

  // The default task
  gulp.task('default', ['serve']);

  // Clean up
  gulp.task('clean', del.bind(null, [DEST]));

  // 3rd party libraries
  gulp.task('vendor', function () {
    return merge(
      gulp.src(path.join(rootDir,'bower_components/jquery/dist/**'))
        .pipe(gulp.dest(DEST + '/assets/vendor/jquery-' + pkgs.jquery)),
      gulp.src(path.join(rootDir,'bower_components/modernizr/modernizr.js'))
        .pipe($.rename('modernizr.min.js'))
        .pipe($.uglify())
        .pipe(gulp.dest(DEST + '/assets/vendor/modernizr-' + pkgs.modernizr))
    );
  });

  // Static files
  gulp.task('files', function () {
    src.files = 'content/files/**';
    return gulp.src(src.files)
      .pipe(gulp.dest(DEST + '/files'))
      .pipe($.if(watch, reload({stream: true})));
  });

  // Static files
  gulp.task('webroot', function () {
    src.webroot = 'code/webroot/**';
    return gulp.src(src.webroot)
      .pipe(gulp.dest(DEST))
      .pipe($.if(watch, reload({stream: true})));
  });

  // Images
  gulp.task('assets-images', function () {
    src.images = path.join(rootDir,'code/assets/images/**');
    return gulp.src(src.images)
      .pipe($.if(RELEASE, $.cache($.imagemin({
        progressive: true,
        interlaced: true
      }))))
      .pipe(gulp.dest(DEST + '/assets/images'))
      .pipe($.if(watch, reload({stream: true})));
  });

  gulp.task('content-images', function () {
    src.images = path.join(rootDir,'content/images/**');
    return gulp.src(src.images)
      .pipe($.if(RELEASE, $.cache($.imagemin({
        progressive: true,
        interlaced: true
      }))))
      .pipe(gulp.dest(DEST + '/images'));
      //.pipe($.if(watch, reload({stream: true})));
  });

  gulp.task('images', ['content-images', 'assets-images']);

  // Fonts
  gulp.task('fonts', function () {
    return gulp.src(path.join(rootDir,'node_modules/bootstrap/fonts/**'))
      .pipe(gulp.dest(DEST + '/assets/fonts'));
  });

  // HTML pages
  gulp.task('pages-flatten', function () {
    var rteAssembleCondition = function(file) {
      return '*.hbs';
    }
    src.pages = path.join(rootDir,'content/pages/**/*');
    return gulp.src(src.pages)
      .pipe($.if('*.hbs', $.assemble({
        data: assembleData,
        partials: path.join(rootDir,'code/partials/**/*.hbs'),
        layout: 'default',
        layoutext: '.hbs',
        layoutdir: path.join(rootDir,'code/layouts')
      })))
      .pipe($.if(RELEASE, $.htmlmin({
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true, minifyCSS: true
      })))
      .pipe($.replace('UA-XXXXX-X', GOOGLE_ANALYTICS_ID))
      .pipe(gulp.dest(DEST))
      .pipe($.if(watch, reload({stream: true})));
  });

  gulp.task('pages', function () {
    var glob = require('glob');
    glob(path.join(rootDir,'content/pages/**/*'), function(err, files) {
      files.forEach(function(filePath) {
        var replacedPath = filePath.replace('content/pages/', '');
        var buildPath = '';
        if ( /\//.test(replacedPath) ) {
          buildPath = replacedPath.substr(0, replacedPath.lastIndexOf('/'));
          buildPath = buildPath.replace(rootDir,'');
        }

        var stream = gulp.src(filePath)
          .pipe($.if('*.hbs', $.assemble({
            data: assembleData,
            partials: path.join(rootDir,'code/partials/**/*.hbs'),
            layoutext: '.hbs',
            layoutdir: path.join(rootDir,'code/layouts')
          })))
          .pipe($.if('*.md', $.assemble({
            data: assembleData,
            partials: path.join(rootDir,'code/partials/**/*.md'),
            layoutext: '.hbs',
            layoutdir: path.join(rootDir,'code/layouts')
          })))
          .pipe($.if(isntFolder, $.if(RELEASE, $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: true, minifyCSS: true
          }))))
          .pipe(gulp.dest(DEST + '/' + buildPath))
          .pipe($.if(watch, reload({stream: true})));

          stream.on('error', function(err) {console.log(err)});
      });
    });
  })

  // CSS style sheets
  gulp.task('styles', function () {
    src.styles = path.join(rootDir,'code/styles/**/*.{css,less}');
    return gulp.src(path.join(rootDir,'code/styles/theme.less'))
      .pipe($.if(!RELEASE, $.sourcemaps.init()))
      .pipe($.less())
      .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
      .pipe($.csscomb())
      .pipe(RELEASE ? $.cssmin() : $.util.noop())
      .pipe($.rename('style.css'))
      .pipe($.if(!RELEASE, $.sourcemaps.write()))
      .pipe(gulp.dest(DEST + '/assets/styles'))
      .pipe($.if(watch, reload({stream: true})));
  });

  // JavaScript
  gulp.task('scripts', function () {
    src.scripts = [path.join(rootDir,'code/scripts/plugins.js'), path.join(rootDir,'code/scripts/main.js')];
    return gulp.src(src.scripts)
      .pipe($.if(!RELEASE, $.sourcemaps.init()))
      .pipe($.concat('bundle.js'))
      .pipe($.if(RELEASE, $.uglify()))
      .pipe($.if(!RELEASE, $.sourcemaps.write()))
      .pipe(gulp.dest(DEST + '/assets/scripts'))
      .pipe($.if(watch, reload({stream: true})));
  });

  // Build
  gulp.task('build', ['clean'], function (cb) {
    runSequence(['images', /*'vendor',*/ 'webroot', 'fonts', 'pages', 'styles', 'scripts'], cb);
  });


  // Run BrowserSync
  gulp.task('serve', ['build'], function () {

    var path = require('path');
    var url = require('url');
    var fs = require('fs');

    browserSync({
      notify: false,
      // Run as an https by uncommenting 'https: true'
      // Note: this uses an unsigned certificate which on first access
      //     will present a certificate warning in the browser.
      // https: true,
      server: {
        baseDir: DEST,
        middleware: function (req, res, cb) {
          var uri = url.parse(req.url);
          if (uri.pathname.length > 1 &&
            path.extname(uri.pathname) === '' &&
            fs.existsSync(DEST + uri.pathname + '.html')) {
            req.url = uri.pathname + '.html' + (uri.search || '');
          }
          cb();
        }
      }
    });

    gulp.watch(src.files, ['files']);
    gulp.watch(src.webroot, ['webroot']);
    gulp.watch(src.images, ['images']);
    gulp.watch(src.pages, ['pages']);
    gulp.watch(src.styles, ['styles']);
    gulp.watch(src.scripts, ['scripts']);
    watch = true;
  });

  gulp.task('serve-nobuild', function () {
    var path = require('path');
    var url = require('url');
    var fs = require('fs');

    browserSync({
      notify: false,
      // Run as an https by uncommenting 'https: true'
      // Note: this uses an unsigned certificate which on first access
      //     will present a certificate warning in the browser.
      // https: true,
      server: {
        baseDir: DEST,
        middleware: function (req, res, cb) {
          var uri = url.parse(req.url);
          if (uri.pathname.length > 1 &&
            path.extname(uri.pathname) === '' &&
            fs.existsSync(DEST + uri.pathname + '.html')) {
            req.url = uri.pathname + '.html' + (uri.search || '');
          }
          cb();
        }
      }
    });
  });

  gulp.task('deploy-gh-pages', function () {
    return gulp.src(DEST + '/**/*')
      .pipe($.ghPages({cacheDir:'./.tmp'}));
  });

  // Publish to Amazon S3 / CloudFront
  gulp.task('deploy-aws', function () {
    var awspublish = require('gulp-awspublish');
    var aws = {
      "key": process.env.AWS_KEY,
      "secret": process.env.AWS_SECRET,
      "bucket": 'XXXXXXXX',
      "region": 'us-standard',
      "distributionId": 'XXXXXXXX'
    };
    var publisher = awspublish.create(aws);
    var headers = {
      'Cache-Control': 'max-age=315360000, no-transform, public'
    };

    return gulp.src(DEST + '/**')
      .pipe($.if(path.join(rootDir,'**/robots.txt'), !argv.production ? $.replace('Disallow:', 'Disallow: /') : $.util.noop()))
      // Add a revisioned suffix to the filename for each static asset
      .pipe($.revAll({
        ignore: [
          /^\/apple-touch-icon-precomposed.png$/g,
          /^\/browserconfig.xml$/g,
          /^\/crossdomain.xml$/g,
          /^\/error.html$/g,
          /^\/humans.txt$/g,
          /^\/robots.txt$/g
        ]
      }))
      // Gzip, set Content-Encoding headers
      .pipe(awspublish.gzip())
      // Publisher will add Content-Length, Content-Type and headers specified above
      // If not specified it will set x-amz-acl to public-read by default
      .pipe(publisher.publish(headers))
      // Create a cache file to speed up consecutive uploads
      .pipe(publisher.cache())
      // Print upload updates to console
      .pipe(awspublish.reporter())
      // Updates the Default Root Object of a CloudFront distribution
      .pipe($.cloudfront(aws));
  });

  // Run PageSpeed Insights
  // Update `url` below to the public URL for your site
  gulp.task('pagespeed', pagespeed.bind(null, {
    // By default, we use the PageSpeed Insights free (no API key) tier.
    // You can use a Google Developer API key if you have one.
    // See http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
    url: BASE_URL,
    strategy: 'mobile'
  }));

  gulp.task('deploy',['build'], function (cb) {
    RELEASE = true;
    runSequence(['deploy-gh-pages'], cb);
  });
}