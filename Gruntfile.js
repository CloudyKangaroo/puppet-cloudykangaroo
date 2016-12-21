module.exports = function(grunt) {
  grunt.initConfig({
    githooks: {
      all: {
        'pre-commit': 'test'
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
        USE_NOCK: 'true',
        NODE_ENV : 'test',
        MGMT_DOMAIN: '.unittest.us',
        CREDS_CLASS: './config/system-dev-credentials',
        CRM_CLASS: 'cloudy-localsmith',
        MON_CLASS: './lib/mockMonitoring',
        INST_CLASS: './lib/insturmentation',
        REDIS_CLASS: 'fakeredis',
        LOG_LEVEL: 'hide',
        LOG_LEVEL_SCREEN: 'hide',
        TZ: 'Etc/GMT'
      },
      development : {
        USE_NOCK: 'true',
        NODE_ENV : 'development',
        MGMT_DOMAIN: '.perspica.io',
        CREDS_CLASS: './config/system-dev-credentials',
        CRM_CLASS: 'cloudy-localsmith',
        MON_CLASS: './lib/monitoring',
        INST_CLASS: './lib/instrumentation',
        ADMIN_CLASS: './lib/admin',
        REDIS_CLASS: 'fakeredis',
        LOG_LEVEL: 'hide',
        LOG_LEVEL_SCREEN: 'info',
        TZ: 'Etc/GMT'
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
      coverage: {
        options: {
          coveralls: true,
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
          timeout: 1000
        },
        src: ['test/**/*.js']
      }
    },
    execute: {
        target: {
            src: ['src/app.js']
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
  grunt.loadNpmTasks('grunt-execute');

  grunt.registerTask('hooks', 'githooks');
  grunt.registerTask('run', ['env:development', 'execute']);
  grunt.registerTask('test', ['env:test', 'mochaTest', 'mochacov:test', 'jshint']);
  grunt.registerTask('report', ['test', 'mochacov:coverage']);
  grunt.registerTask('default', ['env:development', 'mochaTest']);
};
