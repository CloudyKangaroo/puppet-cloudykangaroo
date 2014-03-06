module.exports = function(grunt) {
  grunt.initConfig({
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
  grunt.loadNpmTasks('grunt-blanket');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('test', ['env:test', 'mochaTest', 'mochacov:test', 'jshint']);
  grunt.registerTask('default', ['env:development', 'mochaTest']);
};
