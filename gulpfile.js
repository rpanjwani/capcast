var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var serve = require('gulp-serve');
var isWatching = false;

gulp.task('serve', serve('public'));
gulp.task('serve-build', serve(['public', 'build']));
gulp.task('serve-prod', serve({
    root: ['public', 'build'],
    port: 80,
    middleware: function(req, res) {
        // custom optional middleware 
    }
}));

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('js/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});


gulp.on('stop', function() {
    if (!isWatching) {
        process.nextTick(function() {
            process.exit(0);
        });
    }
});

// Watch Files For Changes
gulp.task('watch', function() {
	isWatching = true;
    gulp.watch('js/*.js', ['scripts']);
    gulp.watch('css/*.css', ['css']);
});

gulp.task('default', ['scripts', 'watch']);