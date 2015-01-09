/*!
 * Static Site Starter Kit | https://github.com/kriasoft/static-site-starter
 * Copyright (c) Konstantin Tarkus, KriaSoft LLC. All rights reserved. See COPYRIGHT.txt
 */

'use strict';

// Include Gulp and other build automation tools and utilities
// See: https://github.com/gulpjs/gulp/blob/master/docs/API.md
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var argv = require('minimist')(process.argv.slice(2));

var opt = {
  paths: {
    content: {
      self: 'contenido',
      files: 'descargas/**',
      images: '**/*.{jpg,png,svg}',
      pages: '**/*.{hbs,md}'
    },
    code: {
      self: 'codigo',
      webroot: 'webroot',
      assets: {
        self: 'assets',
        images: 'images',
        fonts: 'fonts',
        vendor: 'vendor'
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
  }
};

require('./codigo/config/chancholimpio')(gulp, opt, __dirname, argv, $);
