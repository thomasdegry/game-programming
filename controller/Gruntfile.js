var jspaths = [
        'src/js-dev/setup.js',
        'src/js-dev/classes/*.js',
        'src/js-dev/main.js'
    ], csspaths = [
        'src/scss/*.scss',
        'src/scss/modules/*.scss'
    ];

module.exports = function (grunt) {
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                banner: '(function(){\n\n',
                footer: '\n\n})();',
                separator: '\n\n'
            },
            dist: {
                src: jspaths,
                dest: 'src/js/main.js'
            }
        },

        watch: {
            scripts: {
                files: jspaths,
                tasks: ['jshint', 'concat']
            },
            css: {
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
                    'out/js/main.js': jspaths
                }
            }
        },

        compass: {
            development: {
                options: {
                    sassDir: 'src/scss',
                    cssDir: 'src/css',
                    environment: 'development'
                }
            },
            production: {
                options: {
                    sassDir: 'src/scss',
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
                        src: ['index.html', 'images/*', 'js/vendor/*'],
                        dest: 'out/'
                    }
                ]
            }
        },

        jshint: {
            default: {
                options: {
                    browser: true,
                    curly: true,
                    eqeqeq: true,
                    eqnull: true,
                    globals: {
                        $: true,
                        _: true,
                        console: true,
                        tpl: true
                    },
                    immed: true,
                    latedef: true,
                    noarg: true,
                    noempty: true,
                    sub: true,
                    trailing: true,
                    undef: true
                },
                files: {
                    src: jspaths
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint', 'concat', 'compass:development', 'watch']);
    grunt.registerTask('production', ['jshint', 'uglify', 'compass:production', 'copy:production']);
};