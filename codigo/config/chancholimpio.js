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
var fm = require('front-matter');
var glob = require('glob');
var async = require('async');

var defaultPaths = {
  content: {
    self: 'content',
    files: 'files/**',
    images: {
      self: '**/*.{jpg,png,svg,gif}',
      resize: [],
      thumb: {}
    },
    pages: 'pages/**/*'
  },
  code: {
    self: 'code',
    webroot: 'webroot',
    assets: {
      self: 'assets',
      images: 'images',
      fonts: 'fonts',
      vendor: {}
    },
    partials: 'partials/**/*.hbs',
    layouts: 'layouts',
    helpers: 'helpers/**/*.js',
    styles: {
      self: 'styles',
      src: '**/*.{css,less}',
      theme: 'theme.less'
    },
    scripts: {
      self: 'scripts',
      src: '{plugins,main,*}.js',
      bundle: 'bundle.js'
    },
    vendor: {
      script: 'vendor.js',
      bundle: 'vendor.js'
    }
  }
};

module.exports = function(gulp, opt, rootDir, argv, $) {
  var config = {
    dest: './site'
  }

  var paths = _.extend({},defaultPaths,opt.paths);;
  // var paths = {
  //   content: {
  //     self: 'contenido',
  //     files: '**/*(.pdf|.zip)'

  //   }
  // }

  // Settings
  var RELEASE_URL = 'biblioteca-papa';
  var DEST = config.dest;             // The build output folder
  var RELEASE = !!argv.release;         // Minimize and optimize during a build?
  var BASE_URL = RELEASE? RELEASE_URL: '';
  process.env.BASE_URL = BASE_URL;
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
  gulp.task('vendor', ['assets-vendor'], function () {
    gulp.src(path.join(
        rootDir,
        paths.code.self,
        paths.code.scripts.self,
        paths.code.vendor.script
      ))
      .pipe($.include())
      .pipe($.if(RELEASE, $.uglify()))
      .pipe(gulp.dest(path.join(
        DEST,
        paths.code.assets.self,
        paths.code.scripts.self
      )));
  });

  gulp.task('assets-vendor', function () {
    _.each(paths.code.assets.vendor, function(assetsSrc, vendorSrc) {
      _.each(assetsSrc, function(assetSrc) {
        var vaSrc = path.join(
          rootDir,
          vendorSrc,
          assetSrc
        );
        
        return gulp.src(vaSrc)
          .pipe($.if(RELEASE, $.cache($.imagemin({
            progressive: true,
            interlaced: true
          }))))
          .pipe(gulp.dest(path.join(
            DEST,
            paths.code.assets.self,
            assetSrc.replace('/**/*','')
          )));
      });
    });
  });

  // Static files
  gulp.task('files', function () {
    src.files = path.join(paths.content.self, paths.content.files);
    return gulp.src(src.files)
      .pipe(gulp.dest(DEST))
      .pipe($.if(watch, reload({stream: true})))
  });

  // Static files
  gulp.task('webroot', function () {
    src.webroot = path.join(paths.code.self, paths.code.webroot, '**.*');
    return gulp.src(src.webroot)
      .pipe(gulp.dest(DEST))
      .pipe($.if(watch, reload({stream: true})));
  });

  // Images
  gulp.task('assets-images', function () {
    src.images = path.join(
      rootDir,
      paths.code.self,
      paths.code.assets.self,
      paths.code.assets.images
    );

    return gulp.src(src.images)
      .pipe($.if(RELEASE, $.cache($.imagemin({
        progressive: true,
        interlaced: true
      }))))
      .pipe(gulp.dest(path.join(
        DEST,
        paths.code.assets.self,
        paths.code.assets.images
      )))
      .pipe($.if(watch, reload({stream: true})));
  });

  gulp.task('content-images', function () {
    src.images = path.join(
      rootDir,
      paths.content.self,
      paths.content.images.self
    );
    return gulp.src(src.images)
      .pipe($.if(RELEASE, $.cache($.imagemin({
        progressive: true,
        interlaced: true
      }))))
      .pipe(gulp.dest(DEST));
      //.pipe($.if(watch, reload({stream: true})));
  });

  gulp.task('resize-images', ['thumb-images'], function () {
    _.each(paths.content.images.resize, function(thePath) {
      gulp.src(path.join(
          rootDir,
          paths.content.self,
          thePath
        ))
        .pipe($.cache($.gm(function (gmfile, done) {
          return done(null, gmfile.resize(1280, null, '<'));
        })))
        .pipe($.if(RELEASE, $.cache($.imagemin({
          progressive: true,
          interlaced: true
        }))))
        .pipe(gulp.dest(path.join(DEST, path.dirname(thePath))));
    });
  });

  gulp.task('thumb-images', ['content-images'], function () {
    _.each(paths.content.images.thumb, function(dimensions, thePath) {
      gulp.src(path.join(
          rootDir,
          paths.content.self,
          thePath
        ))
        .pipe($.gm(function (gmfile, done) {
          var destPath = gmfile.source.replace('.jpg','_thumb.jpg');
          destPath = destPath.replace(path.join(rootDir,paths.content.self), DEST);
          return done(null, gmfile.thumb(dimensions[0], dimensions[1], destPath, 0, function() {

          }));
        }))
        .pipe($.if(RELEASE, $.cache($.imagemin({
          progressive: true,
          interlaced: true
        }))))
        .pipe(gulp.dest(path.join(DEST, path.dirname(thePath))));
    });
  });

  gulp.task('images', ['assets-images', 'resize-images']);

  // Fonts
  gulp.task('fonts', function () {
    return gulp.src(path.join(rootDir,'node_modules/bootstrap/fonts/**'))
      .pipe(gulp.dest(path.join(
        DEST,
        paths.code.assets.self,
        paths.code.assets.fonts
      )));
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
    
    src.pages = path.join(
      rootDir,
      paths.content.self,
      paths.content.pages
    );

    glob(src.pages, function(err, files) {
      var menu = {};
      async.each(files, function(filePath, cb) {
        fs.readFile(filePath, 'utf8', function(err, data){
          if (err) {
            throw err
          }

          var pageData = fm(data);

          if(pageData.excludeFromMenu) {
            return;
          }

          var relPath = filePath.replace(path.join(rootDir, paths.content.self, '/'), '');

          var absolutePath = path.join(
            '/', BASE_URL,
            relPath.replace(/(.*)\.[^.]+$/, "$1.html")
          );

          var categories = path.dirname(relPath).split(path.sep);
          var contentKey = path.basename(relPath).replace(/(.*)\.[^.]+$/, "$1");

          var it = menu;
          for(var i in categories) {
            var cat = categories[i];
            if(!it[cat]) {
              it[cat] = {
                title: cat
              };
            }
            it = it[cat];
          }
          
          var page = it[contentKey] = _.extend({
            isPage: true,
            absolutePath: absolutePath
          }, _.omit( pageData.attributes, 'layout' ));

          if(!page.title) {
            page.title = page.titulo || page.nombre || contentKey;
          }

          cb();
        });
      }, function(err) {
        if (err) throw err

        function promoteIndex(submenu) {
          if(_.isObject(submenu)) {
            var keys = _.keys(submenu);
            // solo tiene index
            if(_.isEmpty(_.difference(keys, ['title','index']))) {
              _.extend(submenu, submenu['index']);
              delete submenu['index'];
            } else { // tiene index y otras pages
              if(_.contains(keys, 'index')) {
                submenu.title = submenu.index.title;
                if(submenu.index.indice) {
                  submenu.indice = submenu.index.indice;
                }
              }
              _.each(keys, function(key, index) {
                promoteIndex(submenu[key]);
              });
            }            
          }         
        }

        function sortKeys(orig, sorted) {
          if(!orig || typeof orig != 'object') {
            sorted = orig;
            return;
          } 

          var keys = Object.keys(orig);

          var i, len = keys.length;

          keys = _.sortBy(keys, function(key) {
            if(key == 'index') {
              return 0
            }

            var page = orig[key];
            if(page) {
              if(page.hasOwnProperty('indice')) {
                return page.indice
              } else {
                return '0'+(page.title || page.titulo || page.nombre);
              }
            } else {
              return '0'+key;
            }
          });

          for (i = 0; i < len; i++) {
            var k = keys[i];
            if(typeof orig[k] != 'object') {
              sorted[k] = orig[k];
            } else {
              if(!sorted[k]) {
                sorted[k] = {};
              }
              sortKeys(orig[k],sorted[k]);
            }
          }
        }

        promoteIndex(menu);

        for(var key in menu['.']) {
          var rootPage = menu['.'][key];
          if(key != 'title') {
            menu[key] = rootPage;
            delete menu['.'][key];
          }
        }

        var sortedMenu = {};
        sortKeys(menu,sortedMenu);

        glob(src.pages, function(err, files) {
          files.forEach(function(filePath) {
            var replacedPath = filePath.replace(path.join(
              paths.content.self,
              paths.content.pages
            ).replace('**/*'), '');
            var buildPath = '';
            if ( /\//.test(replacedPath) ) {
              buildPath = replacedPath.substr(0, replacedPath.lastIndexOf('/'));
              buildPath = buildPath.replace(rootDir,'');
            }
            //
            // buildPath = buildPath.replace(
            //   path.join(
            //     paths.content.self,
            //     paths.content.pages
            //   ).replace('**.*'),
            //   ''
            // );

            var partialsPath = path.join(
              rootDir,
              paths.code.self,
              paths.code.partials
            );

            var layoutDir = path.join(
              rootDir,
              paths.code.self,
              paths.code.layouts
            );

            var assembleOpt = {
              data: _.extend({menu: sortedMenu}, assembleData),
              partials: partialsPath,
              layoutext: '.hbs',
              layoutdir: layoutDir,
              helpers: [path.join(
                rootDir,
                paths.code.self,
                paths.code.helpers
              )]
            };

            var stream = gulp.src(filePath)
              .pipe($.assemble( assembleOpt ))
              // .pipe($.if('*.hbs', $.assemble( assembleOpt )))
              // .pipe($.if('*.md',  $.assemble( _.extend({
              //   plugins: ['assemble-markdown-pages'],
              //   markdownPages: {
              //     src: filePath,
              //     dest: ''
              //   }
              // }, assembleOpt) )))
              .pipe($.if(isntFolder, $.if(RELEASE, $.htmlmin({
                removeComments: true,
                collapseWhitespace: true,
                minifyJS: true, minifyCSS: true
              }))))
              .pipe(gulp.dest(path.join(
                DEST,
                '/',
                buildPath.replace(path.join(
                  paths.content.self,
                  paths.content.pages
                ).replace('/**/*.{hbs,md}',''),'')
              )))
              .pipe($.if(watch, reload({stream: true})));

              stream.on('error', function(err) {console.log(err)});
          });
        });
      });
    });


  })

  // CSS style sheets
  gulp.task('styles', function () {
    src.styles = path.join(
      rootDir,
      paths.code.self,
      paths.code.styles.self,
      paths.code.styles.src
    );
    return gulp.src(path.join(
      rootDir,
      paths.code.self,
      paths.code.styles.self,
      paths.code.styles.theme
    )).pipe($.if(!RELEASE, $.sourcemaps.init()))
      .pipe($.less())
      .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
      .pipe($.csscomb())
      .pipe(RELEASE ? $.cssmin() : $.util.noop())
      .pipe($.rename('style.css'))
      .pipe($.if(!RELEASE, $.sourcemaps.write()))
      .pipe(gulp.dest(path.join(
        DEST,
        paths.code.assets.self,
        paths.code.styles.self
      )))
      .pipe($.if(watch, reload({stream: true})));
  });

  // JavaScript
  gulp.task('scripts', function () {
    src.scripts = [path.join(
      rootDir,
      paths.code.self,
      paths.code.scripts.self,
      paths.code.scripts.src
    )];
    return gulp.src(src.scripts)
      .pipe($.if(!RELEASE, $.sourcemaps.init()))
      .pipe($.concat(paths.code.scripts.bundle))
      .pipe($.include())
      .pipe($.if(RELEASE, $.uglify()))
      .pipe($.if(!RELEASE, $.sourcemaps.write()))
      .pipe(gulp.dest(path.join(
        DEST,
        paths.code.assets.self,
        paths.code.scripts.self
      )))
      .pipe($.if(watch, reload({stream: true})));
  });

  // Build
  gulp.task('build', ['clean'], function (cb) {
    runSequence(['files','images', 'vendor', 'webroot', 'fonts', 'pages', 'styles', 'scripts'], cb);
  });

  function serve() {
    var path = require('path');
    var url = require('url');
    var fs = require('fs');

    browserSync({
      notify: false,
      // Run as an https by uncommenting 'https: true'
      // Note: this uses an unsigned certificate which on first access
      //     will present a certificate warning in the browser.
      // https: true,
      port: 5000,
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
  };

  // Run BrowserSync
  gulp.task('serve', ['build'], function() {
    serve();

    gulp.watch(src.files, ['files']);
    gulp.watch(src.webroot, ['webroot']);
    //gulp.watch(src.images, ['images']);
    gulp.watch(src.pages, ['pages']);
    gulp.watch(src.styles, ['styles']);
    gulp.watch(src.scripts, ['scripts']);
    watch = true;
  });

  gulp.task('serve-nobuild', serve);

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
