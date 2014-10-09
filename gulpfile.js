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

require('./code/config/chancholimpio')(gulp, __dirname, argv, $);
