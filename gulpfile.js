const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const rename = require("gulp-rename");
const ts = require('gulp-typescript');
const tsProject = ts.createProject("app/ts/tsconfig.json");
const del = require('del');

function styles() {
    return src('app/sass/*.scss')
    .pipe(sass())
    .pipe(concat('styles.min.css'))
    .pipe(rename('style.min.css'))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(cleancss( { level: { 1: { specialComments: 0 } } } ))
    .pipe(dest('app/css/'))
    .pipe(browserSync.stream())
}

function browsersync() {
    browserSync.init({ 
        server: { baseDir: 'app/' },
        notify: false, 
        online: true,
    });
}

function scripts() {
    return src(['app/**/*.js',])
    .pipe(concat('bank.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js/'))
    .pipe(browserSync.stream());
}

function compileTs() {
    return tsProject.src()
    .pipe(ts(tsProject))
    .pipe(dest('app/ts/'))
    .pipe(browserSync.stream());
}

function startwatch() {
    watch(['app/**/*.ts'], compileTs);
    watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
    watch(['app/**/*.sass'], scripts);
    watch('app/**/*.html').on('change', browserSync.reload);
}

function buildcopy() {
    return src([ 
        'app/css/**/*.min.css',
        'app/js/**/*.min.js',
        'app/**/*.html',
        ], { base: 'app' })
    .pipe(dest('dist'))
}

function cleandist() {
    return del('dist/**/*', { force: true })
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.compileTs = compileTs;
exports.cleandist = cleandist;

exports.build = series(cleandist, compileTs, styles, scripts, buildcopy);
exports.default = parallel(compileTs, styles, scripts, browsersync, startwatch);