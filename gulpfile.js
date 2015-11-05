/* globals console, require */
"use strict";

var gulp = require("gulp");
var changed = require("gulp-changed");
var concat = require("gulp-concat");
var fs = require("fs");
var header = require("gulp-header");
var rename = require("gulp-rename");
var runSequence = require("run-sequence");
var sourcemaps = require("gulp-sourcemaps");
var uglify = require("gulp-uglify");
var zip = require("gulp-zip");

var pkg = require("./package.json");

var CONST = {
	SRC_FOLDER: "src",
	DIST_FOLDER: "dist",
	MIN_SUFFIX: ".min.js",
	CSS_SRC: "src/jasmine-tree.css",
	JS_SRC: "src/jasmine-tree.js",
	FOLDERS_TO_ARCHIVE: ["dist/**/*", "lib/**/*", "src/**/*", "test/**/*"],
	ARCHIVE_FILE: "jasmine-tree.zip",
	ARCHIVE_FOLDER: "archive",
	VERSION_PATTERN: new RegExp("version = \"(\\d.\\d(.\\d)?)\";")
};

function assembleBanner(version){
	var now = new Date();
	var banner = [
		"/*! ",
		"Jasmine Tree " + version + " " + now.toISOString(),
		"Copyright " + now.getFullYear() + " Massimo Foti (massimo@massimocorner.com) and Emily Meroni (emily.meroni@gmail.com)",
		"Licensed under the Apache License, Version 2.0 | http://www.apache.org/licenses/LICENSE-2.0",
		" */",
		""].join("\n");
	return banner;
}

function getJsVersion(){
	var buffer = fs.readFileSync(CONST.JS_SRC);
	var fileStr = buffer.toString("utf8", 0, buffer.length);
	var version = CONST.VERSION_PATTERN.exec(fileStr)[1];
	return version;
}

gulp.task("css", function(){
	var jsVersion = getJsVersion();
	return gulp.src(CONST.CSS_SRC)
		// The "changed" task needs to know the destination directory
		// upfront to be able to figure out which files changed
		.pipe(changed(CONST.DIST_FOLDER))
		.pipe(header(assembleBanner(jsVersion)))
		.pipe(gulp.dest(CONST.DIST_FOLDER));
});

gulp.task("js", function(){
	var jsVersion = getJsVersion();
	return gulp.src(CONST.JS_SRC)
		// The "changed" task needs to know the destination directory
		// upfront to be able to figure out which files changed
		.pipe(changed(CONST.DIST_FOLDER))
		.pipe(uglify({
			mangle: false
		}))
		.pipe(rename({
			extname: CONST.MIN_SUFFIX
		}))
		.pipe(header(assembleBanner(jsVersion)))
		.pipe(sourcemaps.init())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(CONST.DIST_FOLDER));
});

gulp.task("zip", function(){
	return gulp.src(CONST.FOLDERS_TO_ARCHIVE, {base: "."})
		.pipe(zip(CONST.ARCHIVE_FILE))
		.pipe(gulp.dest(CONST.ARCHIVE_FOLDER));
});

gulp.task("default", function(callback){
	runSequence(
		"css",
		"js",
		"zip",
		function(error){
			if(error){
				console.log(error.message);
			}
			else{
				console.log("BUILD FINISHED SUCCESSFULLY");
			}
			callback(error);
		});
});