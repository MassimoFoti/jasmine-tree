/* global jasmine */

/* istanbul ignore if */
if(typeof(jQuery) === "undefined"){
	throw("Unable to find jQuery");
}

/* istanbul ignore else */
if(typeof(window.jasmineTree) === "undefined"){
	window.jasmineTree = {};
}

(function(){
	"use strict";

	jasmineTree.version = "1.0";

	var CONST = {
		CSS_CLASSES: {
			SUMMARY: "jasmine-tree-summary",
			TRIGGER: "jasmine-tree-trigger",
			TOOLBAR: "jasmine-tree-toolbar",
			BUTTON: "jasmine-tree-button",
			NODE_OPENED: "jasmine-tree-opennode"
		},
		SELECTORS: {
			FIRST_CHILD: ":first-child",
			SUMMARY: ".summary,.jasmine-summary",
			ROOT_SUITE: ".summary > .suite,.jasmine-summary > .jasmine-suite",
			NODE_TITLE: "> li.suite-detail,> li.jasmine-suite-detail",
			NODE_SPECS: "> ul.specs,> ul.jasmine-specs",
			NODE_SUITES: "> ul.suite,> ul.jasmine-suite"
		},
		TEXT: {
			COLLAPSE: "Collapse All",
			EXPAND: "Expand All",
			SEPARATOR: " | ",
			PLUS: "+",
			MINUS: "-"
		},
		FILTER_REGEXP: (new RegExp("[?&]spec=([^&]*)"))
	};

	/** @type {Array.<jasmineTree.Suite>} */
	var rootSuites = [];

	/**
	 * Returns the value of the "spec" parameter in the querystring. Null if it's not specified
	 * @return {null|String}
	 */
	jasmineTree.getSpecFilter = function(){
		var match = CONST.FILTER_REGEXP.exec(window.location.search);
		if(match !== null) {
			var filter = decodeURIComponent(match[1].replace(/\+/g, " "));
			if(filter !== "") {
				return filter;
			}
		}
	};

	/**
	 * Collapse all the suites
	 */
	jasmineTree.collapseAll = function(){
		for(var i = 0; i < rootSuites.length; i++){
			rootSuites[i].collapse();
		}
	};

	/**
	 * Expand all the suites
	 */
	jasmineTree.expandAll = function(){
		for(var i = 0; i < rootSuites.length; i++){
			rootSuites[i].expand();
		}
	};

	/**
	 * Add a CSS class to the summary to enable more specific CSS selectors
	 */
	jasmineTree.addRootClass = function(){
		jQuery(CONST.SELECTORS.SUMMARY).addClass(CONST.CSS_CLASSES.SUMMARY);
	};

	/**
	 * Insert toolbar with expand/collapse all buttons
	 */
	jasmineTree.addToolbar = function(){

		var toolbar = jQuery("<div></div>").addClass(CONST.CSS_CLASSES.TOOLBAR);
		var collapse = jQuery("<span></span>").addClass(CONST.CSS_CLASSES.BUTTON).text(CONST.TEXT.COLLAPSE);
		toolbar.append(collapse);
		var separator = jQuery("<span></span>").text(CONST.TEXT.SEPARATOR);
		toolbar.append(separator);
		var expand = jQuery("<span></span>").addClass(CONST.CSS_CLASSES.BUTTON).text(CONST.TEXT.EXPAND);
		toolbar.append(expand);

		collapse.click(function(event){
			event.preventDefault();
			jasmineTree.collapseAll();
		});

		expand.click(function(event){
			event.preventDefault();
			jasmineTree.expandAll();
		});

		toolbar.insertBefore(jQuery(CONST.SELECTORS.SUMMARY));
	};

	/**
	 * Check the querystring and expand/collapse suites based on filter criteria (if any)
	 */
	jasmineTree.filterSpec = function(){
		var filter = jasmineTree.getSpecFilter();
		if(filter === undefined){
			return;
		}
		// We have a filter. First collapse all
		jasmineTree.collapseAll();
		// Then expand only the suites that match
		for(var i = 0; i < rootSuites.length; i++){
			if(rootSuites[i].containsPath(filter) === true){
				rootSuites[i].expand();
			}
		}
	};

	/**
	 * @typedef {Object} jasmineTree.Suite.options
	 *
	 * @property {jQuery} rootNode
	 * @property {String} rootPath
	 */

	/**
	 * Wrapper around a suite's HTML node. Adds expand/collapse capabilities
	 * @param {jasmineTree.Suite.options} options
	 * @constructor
	 */
	jasmineTree.Suite = function(options){
		var config = {
			rootNode: null,
			rootPath: ""
		};
		jQuery.extend(config, options);

		/** @type  {jasmineTree.Suite} */
		var self = this;

		/** @type {Array.<jasmineTree.Suite>} */
		var suites = [];
		/** @type {Array.<jQuery>} */
		var specs = [];

		var fullPath = "";
		var expanded = true;
		var triggerNode = jQuery("<a></a>").text(CONST.TEXT.MINUS).addClass(CONST.CSS_CLASSES.TRIGGER);

		var init = function(){
			config.rootNode.addClass(CONST.CSS_CLASSES.NODE_OPENED);

			var titleNode = config.rootNode.find(CONST.SELECTORS.NODE_TITLE);

			fullPath = config.rootPath + jQuery.trim(titleNode.text());
			triggerNode.insertBefore(titleNode.find(CONST.SELECTORS.FIRST_CHILD));

			config.rootNode.find(CONST.SELECTORS.NODE_SPECS).each(function(index, item){
				specs.push(jQuery(item));
			});
			config.rootNode.find(CONST.SELECTORS.NODE_SUITES).each(function(index, item){
				var childSuite = new jasmineTree.Suite({
					rootNode: jQuery(item),
					rootPath: fullPath + " "
				});
				suites.push(childSuite);
			});
			attachEvents();
		};

		var attachEvents = function(){
			triggerNode.click(function(event){
				event.preventDefault();
				if(expanded === true){
					self.collapse();
				}
				else{
					self.expand();
				}
			});
		};

		var startsWith = function(str, subStr){
			return (str.substring(0, subStr.length) === subStr);
		};

		this.getPath = function(){
			return fullPath;
		};

		/**
		 * Given a filter string, coming from the querystring, search if the suite contains specs that match it
		 * @param {String} path
		 * @return {Boolean}
		 */
		this.containsPath = function(path){
			// Matches the suite
			if(startsWith(self.getPath(), path) === true){
				return true;
			}
			// Search inside child specs
			for(var j = 0; j < specs.length; j++){
				var specPath = self.getPath() + " " + jQuery.trim(specs[j].text());
				if(specPath === path){
					return true;
				}
			}
			// Search inside child suites
			for(var i = 0; i < suites.length; i++){
				if(suites[i].containsPath(path) === true){
					return true;
				}
			}
			return false;
		};

		this.show = function(){
			config.rootNode.show();
		};

		this.hide = function(){
			config.rootNode.hide();
		};

		this.collapse = function(){
			config.rootNode.removeClass(CONST.CSS_CLASSES.NODE_OPENED);
			triggerNode.text(CONST.TEXT.PLUS);
			for(var i = 0; i < suites.length; i++){
				suites[i].collapse();
				suites[i].hide();
			}
			for(var j = 0; j < specs.length; j++){
				specs[j].hide();
			}
			expanded = false;
		};

		this.expand = function(){
			config.rootNode.addClass(CONST.CSS_CLASSES.NODE_OPENED);
			triggerNode.text(CONST.TEXT.MINUS);
			for(var i = 0; i < suites.length; i++){
				suites[i].expand();
				suites[i].show();
			}
			for(var j = 0; j < specs.length; j++){
				specs[j].show();
			}
			expanded = true;
		};

		init();
	};

	/**
	 * This must be invoked after Jasmine finished executing
	 */
	jasmineTree.init = function(){
		jQuery(CONST.SELECTORS.ROOT_SUITE).each(function(index, item){
			var suite = new jasmineTree.Suite({
				rootNode: jQuery(item)
			});
			rootSuites.push(suite);
		});
		jasmineTree.addRootClass();
		jasmineTree.addToolbar();
		jasmineTree.filterSpec();
	};

	jasmine.getEnv().addReporter({
		jasmineDone: function(){
			jasmineTree.init();
		}
	});

}());