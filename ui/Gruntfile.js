'use strict';

module.exports = function(grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // prepare copyfiles and uglyfiles conditioned on env option

  var env = grunt.option('env');

  var copyfiles = [
    'views/**/{,*/}*.html',
    'templates/**/{,*/}*.html',
    'images/**/{,*/}*.*',
    'styles/fonts/**/{,*/}*.*',
    'i18n/**/{,*/}*.*'
  ];

  if (env === 'dev') {
    copyfiles = copyfiles.concat([
      'scripts/**/{,*/}*.*',
      'plugin.js'
    ]);
  }

  var uglyfiles = (env === 'dev') ? [] : [{
    expand: true,
    src: 'scripts/**/*.js',
    dest: 'build/dist/'
  }, {
    'build/dist/plugin.js': 'plugin.js'
  }];

  // Define the configuration for all the tasks
  grunt.initConfig({
    // Compiles Sass to CSS and generates necessary files if requested
    compass: {
      dist: {
        options: {
          sassDir: 'styles',
          cssDir: 'build/dist/styles',
          raw: 'Sass::Script::Number.precision = 10\n'
        }
      }
    },
    uglify: {
      dist: {
        files: uglyfiles
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dest: 'build/dist',
          src: copyfiles
        }]
      }
    }
  });

  grunt.registerTask('default', [
    'compass',
    'uglify',
    'copy'
  ]);

};
