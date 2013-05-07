/*global require, task, desc, console*/
'use strict';
var path = require('path'),
  fs = require('fs'),
  os = require('os'),
  exec = require('child_process').exec,
  async = require('async'),
  pkg = require('./package.json');

var VERSION = pkg.version;
var ROOT = __dirname;
var SRC_FILE = 'tbtree.js';
var LICENSE_FILE = 'license.js';
var SRC_DIR = path.join(ROOT, 'src');
var BUILD_DIR = path.join(ROOT, 'build');

task('default', function (/*params*/) {
  console.log('Type `jake -T` to see all jake tasks.');
});

function buildOutput(callback) {
  var srcInput = path.join(SRC_DIR, SRC_FILE);
  var licenseInput = path.join(SRC_DIR, LICENSE_FILE);

  async.parallel([
    function (callback) {
      fs.readFile(srcInput, callback);
    },
    function (callback) {
      fs.readFile(licenseInput, callback);
    }
  ], function (err, results) {
    if (err) {
      return callback(err);
    }
    var src = results[0], lic = results[1];
    lic = lic.toString()
      .replace('{{version}}', VERSION)
      .replace('{{year}}', (new Date()).getFullYear());
    var output = lic + os.EOL + src;
    callback(null, output);
  });
}

function writeOutput(output, callback) {
  var buildOutput = path.join(BUILD_DIR, 'scripts', SRC_FILE);

  async.parallel([
    function (callback) {
      fs.writeFile(buildOutput, output, callback);
    }
  ], function (err/*, result*/) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

desc('builds the project');
task('build', function () {
  console.log('Building...');
  async.waterfall([
    function (callback) {
      buildOutput(callback);
    },
    function (output, callback) {
      writeOutput(output, callback);
    }
  ], function (err) {
    if (err) {
      return console.error(err);
    }
    console.log('Build complete.');
  });
});

desc('runs the demo');
task('run', ['build'], function () {
  var demoFile = path.join(BUILD_DIR, 'tree.html');
  exec('open ' + demoFile, function (err, stdout, stderr) {
    if (err) {
      console.error(err);
    }
    console.log(stderr);
    console.log(stdout);
  });
});