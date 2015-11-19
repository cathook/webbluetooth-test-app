/* jshint node: true */
'use strict';
var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('gulp-jscs-stylish');

var noop = function() {};

var LINT_SOURCES = [
  '**/*.js',
  '!bower_components/**',
  '!node_modules/**'
];

gulp.task('lint', function() {
  return gulp.src(LINT_SOURCES)
      .pipe(jshint('.jshintrc'))
      .pipe(jscs('.jscsrc'))
      .on('error', noop)  // don't stop on error
      .pipe(stylish.combineWithHintResults())
      .pipe(jshint.reporter('default'));
});
