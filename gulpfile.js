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
      files: '**/*.{pdf,zip,json,css,js}',
      images: {
        self: '**/*.{jpg,png,svg,gif}',
        resize: [
          'origen/historia/imagenes/**.jpg',
          'cocina/galeria/fotos/**.jpg',
        ],
        thumb: {
          'origen/historia/imagenes/**.jpg': [40, 40],
          'cocina/galeria/fotos/**.jpg': [88, 55],
        }
      },
      pages: '**/*.{hbs,md}'
    },
    code: {
      self: 'codigo',
      webroot: 'webroot',
      assets: {
        self: 'assets',
        images: 'images',
        fonts: 'fonts',
        vendor: {
          'bower_components/unitegallery/package/unitegallery': [
            'skins/**/*',
            'images/**/*'
          ]
        }
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
