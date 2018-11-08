/* istanbul ignore else */
if(typeof(window.jasmineTree) === "undefined"){
	window.jasmineTree = {};
}

(function(){
	"use strict";

	jasmineTree.version = "2.0";

	const CONST = {
		CSS_CLASSES: {
			SUMMARY: "jasmine-tree-summary",
			TRIGGER: "jasmine-tree-trigger",
			TOOLBAR: "jasmine-tree-toolbar",
			BUTTON: "jasmine-tree-button",
			NODE_OPENED: "jasmine-tree-opennode"
		},
		SELECTORS: {
			FIRST_CHILD: ":first-child",
			SUMMARY: ".jasmine-summary",
			ROOT_SUITE: ".jasmine-summary > .jasmine-suite",
			NODE_TITLE: "li.jasmine-suite-detail",
			NODE_SPECS: "ul.jasmine-specs",
			NODE_SUITES: "ul.jasmine-suite"
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
	const rootSuites = [];

	/**
	 * Returns the value of the "spec" parameter in the given string. Undefined if it's not specified
	 * @param {string} searchStr
	 * @return {undefined|string}
	 */
	jasmineTree.getSpecFilter = function(searchStr){
		const match = CONST.FILTER_REGEXP.exec(searchStr);
		if(match !== null){
			const filter = decodeURIComponent(match[1].replace(/\+/g, " "));
			/* istanbul ignore else */
			if(filter !== ""){
				return filter;
			}
		}
	};

	/**
	 * Collapse all the suites
	 */
	jasmineTree.collapseAll = function(){
		for(let i = 0; i < rootSuites.length; i++){
			rootSuites[i].collapse();
		}
	};

	/**
	 * Expand all the suites
	 */
	jasmineTree.expandAll = function(){
		for(let i = 0; i < rootSuites.length; i++){
			rootSuites[i].expand();
		}
	};

	/**
	 * Add a CSS class to the summary to enable more specific CSS selectors
	 */
	jasmineTree.addRootClass = function(){
		document.querySelector(CONST.SELECTORS.SUMMARY).classList.add(CONST.CSS_CLASSES.SUMMARY);
	};

	/**
	 * Insert toolbar with expand/collapse all buttons
	 */
	jasmineTree.addToolbar = function(){

		const toolbar = document.createElement("div");
		toolbar.classList.add(CONST.CSS_CLASSES.TOOLBAR);

		const collapse = document.createElement("span");
		collapse.classList.add(CONST.CSS_CLASSES.BUTTON);
		collapse.textContent = CONST.TEXT.COLLAPSE;
		toolbar.appendChild(collapse);

		const separator = document.createElement("span");
		separator.textContent = CONST.TEXT.SEPARATOR;
		toolbar.appendChild(separator);

		const expand = document.createElement("span");
		expand.classList.add(CONST.CSS_CLASSES.BUTTON);
		expand.textContent = CONST.TEXT.EXPAND;
		toolbar.appendChild(expand);

		collapse.addEventListener("click", function(event){
			event.preventDefault();
			jasmineTree.collapseAll();
		});

		expand.addEventListener("click", function(event){
			event.preventDefault();
			jasmineTree.expandAll();
		});

		const summaryNode = document.querySelector(CONST.SELECTORS.SUMMARY);
		summaryNode.parentNode.insertBefore(toolbar, summaryNode);
	};

	/**
	 * Check the querystring and expand/collapse suites based on filter criteria (if any)
	 */
	jasmineTree.filterSpec = function(){
		const filter = jasmineTree.getSpecFilter(window.location.search);
		if(filter === undefined){
			return;
		}
		// We have a filter. First collapse all
		jasmineTree.collapseAll();
		// Then expand only the suites that match
		for(let i = 0; i < rootSuites.length; i++){
			if(rootSuites[i].containsPath(filter) === true){
				rootSuites[i].expand();
			}
		}
	};

	/**
	 * @typedef {Object} jasmineTree.Suite.options
	 *
	 * @property {HTMLElement} rootNode
	 * @property {string} rootPath
	 */

	/**
	 * Wrapper around a suite's HTML node. Adds expand/collapse capabilities
	 * @param {jasmineTree.Suite.options} options
	 * @constructor
	 */
	jasmineTree.Suite = function(options){
		/**
		 * @type {jasmineTree.Suite.options}
		 */
		const config = {
			rootNode: options.rootNode,
			rootPath: options.rootPath
		};
		if(config.rootPath === undefined){
			config.rootPath = "";
		}

		/** @type  {jasmineTree.Suite} */
		const self = this;

		/** @type {Array.<jasmineTree.Suite>} */
		const suites = [];
		/** @type {Array.<jQuery>} */
		const specs = [];

		let fullPath = "";
		let expanded = true;

		const triggerNode = document.createElement("a");
		triggerNode.classList.add(CONST.CSS_CLASSES.TRIGGER);
		triggerNode.textContent = CONST.TEXT.MINUS;

		const init = function(){
			config.rootNode.classList.add(CONST.CSS_CLASSES.NODE_OPENED);

			let titleNode;
			Array.prototype.slice.call(config.rootNode.children).forEach(function(item){
				if(nodeMatches(item, CONST.SELECTORS.NODE_TITLE) === true){
					titleNode = item;
				}
			});

			fullPath = config.rootPath + titleNode.textContent.trim();

			const linkNode = titleNode.querySelector(CONST.SELECTORS.FIRST_CHILD);
			linkNode.parentNode.insertBefore(triggerNode, linkNode);

			Array.prototype.slice.call(config.rootNode.children).forEach(function(item){
				if(nodeMatches(item, CONST.SELECTORS.NODE_SPECS) === true){
					specs.push(item);
				}
			});

			Array.prototype.slice.call(config.rootNode.children).forEach(function(item){
				if(nodeMatches(item, CONST.SELECTORS.NODE_SUITES) === true){
					const childSuite = new jasmineTree.Suite({
						rootNode: item,
						rootPath: fullPath + " "
					});
					suites.push(childSuite);
				}
			});

			attachEvents();
		};

		const attachEvents = function(){
			triggerNode.addEventListener("click", function(event){
				event.preventDefault();
				if(expanded === true){
					self.collapse();
				}
				else{
					self.expand();
				}
			});
		};

		/**
		 * Equalize element.matches across browsers
		 * @param {HTMLElement} node
		 * @param {string} selector
		 * @return {boolean}
		 */
		const nodeMatches = function(node, selector){
			let methodName = "matches";
			// Deal with IE11 without polyfills
			/* istanbul ignore next */
			if(node.matches === undefined && node.msMatchesSelector !== undefined){
				methodName = "msMatchesSelector";
			}
			return node[methodName](selector);
		};

		const startsWith = function(str, subStr){
			return (str.substring(0, subStr.length) === subStr);
		};

		this.getPath = function(){
			return fullPath;
		};

		/**
		 * Given a filter string, coming from the querystring, search if the suite contains specs that match it
		 * @param {string} path
		 * @return {boolean}
		 */
		this.containsPath = function(path){
			// Matches the suite
			if(startsWith(self.getPath(), path) === true){
				return true;
			}
			// Search inside child specs
			for(let j = 0; j < specs.length; j++){
				const specPath = self.getPath() + " " + specs[j].textContent.trim();
				if(specPath === path){
					return true;
				}
			}
			// Search inside child suites
			for(let i = 0; i < suites.length; i++){
				if(suites[i].containsPath(path) === true){
					return true;
				}
			}
			return false;
		};

		this.show = function(){
			config.rootNode.style.display = "block";
		};

		this.hide = function(){
			config.rootNode.style.display = "none";
		};

		this.collapse = function(){
			config.rootNode.classList.remove(CONST.CSS_CLASSES.NODE_OPENED);
			triggerNode.textContent = CONST.TEXT.PLUS;
			for(let i = 0; i < suites.length; i++){
				suites[i].collapse();
				suites[i].hide();
			}
			for(let j = 0; j < specs.length; j++){
				specs[j].style.display = "none";
			}
			expanded = false;
		};

		this.expand = function(){
			config.rootNode.classList.add(CONST.CSS_CLASSES.NODE_OPENED);
			triggerNode.textContent = CONST.TEXT.MINUS;
			for(let i = 0; i < suites.length; i++){
				suites[i].expand();
				suites[i].show();
			}
			for(let j = 0; j < specs.length; j++){
				specs[j].style.display = "block";
			}
			expanded = true;
		};

		init();
	};

	/**
	 * This must be invoked after Jasmine finished executing
	 */
	jasmineTree.init = function(){

		Array.prototype.slice.call(document.querySelectorAll(CONST.SELECTORS.ROOT_SUITE)).forEach(function(item){
			const suite = new jasmineTree.Suite({
				rootNode: item
			});
			rootSuites.push(suite);
		});

		jasmineTree.addRootClass();
		jasmineTree.addToolbar();
		jasmineTree.filterSpec();
	};

	/* istanbul ignore next */
	if(window.__karma__ === undefined){
		jasmine.getEnv().addReporter({
			jasmineDone: function(){
				jasmineTree.init();
			}
		});
	}

}());