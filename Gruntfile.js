var jspaths = ['src/js-dev/Settings.js', 'src/js-dev/classes/**.js','src/js-dev/helpers.js','src/js-dev/main.js'];
var csspaths = ["src/sass/*.scss", "src/sass/modules/*.scss"];
var templatepaths = ["src/templates/*.hbs"];

var concatpaths = ['src/js/templates.js'].concat(jspaths);

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        banner: "(function(){\n\n",
        footer: "\n\n})();",
        separator: '\n\n'
      },
      dist: {
        src: concatpaths,
        dest: 'src/js/main.js'
      }
    },

    watch: {
      scripts:{
        files: jspaths,
        tasks: ['jshint','concat','clean']
      },
      css:{
        files: csspaths,
        tasks:['compass:development']
      }
    },

    uglify: {
      default: {
        options: {
          wrap: true
        },
        files: {
          'out/js/main.js': concatpaths
        }
      }
    },

    compass: {
      development: { 
        options: {
          sassDir: 'src/sass',
          cssDir: 'src/css',
          environment: 'development'
        }
      },
      production: { 
        options: {
          sassDir: 'src/sass',
          cssDir: 'out/css',
          environment: 'production',
          outputStyle: 'compressed',
          force: true
        }
      }
    },

    copy: {
      production: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['index.html','images/*','js/vendor/*'],
            dest: 'out/'
          }
        ]
      }
    },

    jshint:{
      default:{
        options: {
          curly: true,
          eqeqeq: true,
          immed: true,
          latedef: true,
          noarg: true,
          sub: true,
          undef: true,
          eqnull: true,
          browser: true,
          noempty: true,
          trailing: true,
          globals:{
              $: true,
              console:true,
              createjs: true,
              alert:true,
              tpl:true,
              _:true,
              bean:true
          },
        },
        files:{
          src: jspaths
        }
      }
    },

    clean: ['src/js/templates.js'],

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint','concat','compass:development','clean','watch']);
  grunt.registerTask('production', ['jshint','uglify','compass:production','copy:production']);

};