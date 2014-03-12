module.exports = function(grunt) {
  grunt.initConfig({
    githooks: {
      all: {
        'pre-commit': 'test',
      }
    },
    coveralls: {
      options: {
        force: true
      },
      coveralls: {
        src: 'lcov.info'
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'src/app.js', 'src/routes/**/*.js', 'src/lib/**/*.js', 'src/public/javasripts/newTicketWizard.js', 'src/public/javascripts/sensu-helper.js', 'src/public/javascripts/puppet_gauges.js' ]
    },
    env : {
      test : {
        NODE_ENV : 'test'
      },
      development : {
        NODE_ENV : 'development'
      }
    },
    mochacov: {
      test: {
        options: {
          reporter: 'travis-cov',
          files: 'test/**/*.js',
          src: ['test/**/*.js']
        },
        'pattern': [
          'src'
        ],
        'data-cover-never': 'node_modules'
      },
      lcov: {
        options: {
          reporter: 'mocha-lcov-reporter',
          files: 'test/**/*.js',
          src: ['test/**/*.js']
        },
        'pattern': [
          'src'
        ],
        'data-cover-never': 'node_modules'
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
        },
        src: ['test/**/*.js']
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-blanket');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.loadNpmTasks('grunt-coveralls');

  grunt.registerTask('hooks', 'githooks');
  grunt.registerTask('test', ['env:test', 'mochaTest', 'mochacov:test', 'jshint']);
  grunt.registerTask('report', ['mochacov:lcov', 'coveralls']);
  grunt.registerTask('default', ['env:development', 'mochaTest']);
};
