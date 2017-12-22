describe("jasmineTree", function(){

	"use strict";

	var CONST;
	beforeEach(function(){

		jasmineFixtures.setup({
			basePath: FIXTURES_BASE_PATH
		});

		jasmineFixtures.loadHTML("tree.htm");

		CONST = {
			CSS_CLASSES: {
				SUMMARY: "jasmine-tree-summary",
				NODE_OPENED: "jasmine-tree-opennode"
			},
			SELECTORS: {
				BUTTON: ".jasmine-tree-button",
				SUMMARY: ".summary,.jasmine-summary",
				NODE_OPENED: ".jasmine-tree-opennode",
				TOOLBAR: ".jasmine-tree-toolbar",
				TRIGGER: ".jasmine-tree-trigger",
				TEST_NODE: "#suite-suite19"
			}
		};

	});

	it("Requires jQuery in order to work", function(){
		expect(jQuery).toBeDefined();
	});

	it("Lives inside its own namespace", function(){
		expect(jasmineTree).toBeDefined();
	});

	describe(".version", function(){
		it("Reports the current version number", function(){
			expect(jasmineTree.version).toBeDefined();
		});
	});

	describe(".init()", function(){

		it("Is an utility method to bootstrap the GUI", function(){
			expect(jasmineTree.Suite).toBeDefined();
			expect($.isFunction(jasmineTree.Suite)).toBeTruthy();
		});

		describe("Invokes:", function(){

			it(".addRootClass()", function(){
				spyOn(jasmineTree, "addRootClass");
				jasmineTree.init();
				expect(jasmineTree.addRootClass).toHaveBeenCalled();
			});
			it(".addToolbar()", function(){
				spyOn(jasmineTree, "addToolbar");
				jasmineTree.init();
				expect(jasmineTree.addToolbar).toHaveBeenCalled();
			});
			it(".filterSpec()", function(){
				spyOn(jasmineTree, "filterSpec");
				jasmineTree.init();
				expect(jasmineTree.filterSpec).toHaveBeenCalled();
			});

		});
	});

	describe(".addRootClass()", function(){
		it("Associate the root element to the 'jasmine-tree-summary' CSS class", function(){
			jasmineTree.addRootClass();
			expect(jQuery(CONST.SELECTORS.SUMMARY)).toHaveClass(CONST.CSS_CLASSES.SUMMARY);
		});
	});

	describe(".addToolbar()", function(){
		it("Add the toolbar element to the DOM", function(){
			expect(jQuery(CONST.SELECTORS.TOOLBAR).length).toEqual(0);
			jasmineTree.addToolbar();
			expect(jQuery(CONST.SELECTORS.TOOLBAR).length).toEqual(1);
		});

		describe("The toolbar contains:", function(){
			it("Two buttons", function(){
				jasmineTree.addToolbar();
				expect(jQuery(CONST.SELECTORS.BUTTON).length).toEqual(2);
			});
			it("The first calls .collapseAll()", function(){
				spyOn(jasmineTree, "collapseAll");
				jasmineTree.addToolbar();
				jQuery(CONST.SELECTORS.BUTTON)[0].click();
				expect(jasmineTree.collapseAll).toHaveBeenCalled();
			});
			it("The second calls .expandAll()", function(){
				spyOn(jasmineTree, "expandAll");
				jasmineTree.addToolbar();
				jQuery(CONST.SELECTORS.BUTTON)[1].click();
				expect(jasmineTree.expandAll).toHaveBeenCalled();
			});
		});
	});

	describe(".collapseAll()", function(){
		it("Collapse all the suite's nodes", function(){
			jasmineTree.init();
			expect(jQuery(CONST.SELECTORS.NODE_OPENED).length).toEqual(45);
			jasmineTree.collapseAll();
			expect(jQuery(CONST.SELECTORS.NODE_OPENED).length).toEqual(0);
		});
	});

	describe(".expandAll()", function(){
		it("Expand all the suite's nodes", function(){
			jasmineTree.init();
			expect(jQuery(CONST.SELECTORS.NODE_OPENED).length).toEqual(45);
			jasmineTree.collapseAll();
			expect(jQuery(CONST.SELECTORS.NODE_OPENED).length).toEqual(0);
			jasmineTree.expandAll();
			expect(jQuery(CONST.SELECTORS.NODE_OPENED).length).toEqual(45);
		});
	});


	describe(".filterSpec()", function(){

		describe("If there is no 'spec' entry in the querystring:", function(){
			it("Does nothing", function(){
				spyOn(jasmineTree, "collapseAll");
				jasmineTree.filterSpec();
				expect(jasmineTree.collapseAll).not.toHaveBeenCalled();
			});
		});
		describe("Else:", function(){

			describe("First:", function(){
				it("Calls .collapseAll()", function(){
					spyOn(jasmineTree, "getSpecFilter").and.returnValue("luga.form");
					spyOn(jasmineTree, "collapseAll");
					jasmineTree.filterSpec();
					expect(jasmineTree.collapseAll).toHaveBeenCalled();
				});
			});
			describe("Then::", function(){
				it("Expand the matching suite", function(){
					spyOn(jasmineTree, "getSpecFilter").and.returnValue("luga.form");
					jasmineTree.init();
					expect(jQuery(CONST.SELECTORS.TEST_NODE)).toHaveClass(CONST.CSS_CLASSES.NODE_OPENED);
				});
			});

		});

	});

	describe(".Suite", function(){

		var suiteNode, suite;
		beforeEach(function(){

			suiteNode = jQuery(CONST.SELECTORS.TEST_NODE);
			suite = new jasmineTree.Suite({
				rootNode: suiteNode
			});

		});

		it("Is the constructor for the object that get attached to each suite", function(){
			expect(jasmineTree.Suite).toBeDefined();
			expect($.isFunction(jasmineTree.Suite)).toBeTruthy();
		});

		it("Adds expand/collapse triggers to each suite", function(){
			expect(suiteNode.find(CONST.SELECTORS.TRIGGER).length).toEqual(10);
		});

		it("First click on the trigger collapse the suite, second click expand it", function(){
			var triggerNode = suiteNode.find(CONST.SELECTORS.TRIGGER)[0];
			expect(suiteNode).toHaveClass(CONST.CSS_CLASSES.NODE_OPENED);
			triggerNode.click();
			expect(suiteNode).not.toHaveClass(CONST.CSS_CLASSES.NODE_OPENED);
			triggerNode.click();
			expect(suiteNode).toHaveClass(CONST.CSS_CLASSES.NODE_OPENED);
		});

		describe(".containsPath()", function(){

			describe("Return true if:", function(){

				it("The suite's name starts with the given string", function(){
					expect(suite.containsPath("luga.form")).toBeTruthy();
				});

				it("A child suite's name starts with the given string", function(){
					expect(suite.containsPath("luga.form .toQueryString()")).toBeTruthy();
				});

				it("A child spec's name starts with the given string", function(){
					expect(suite.containsPath("luga.form .toQueryString() Ignores unsuccessful fields")).toBeTruthy();
				});

			});

			describe("Return false:", function(){

				it("Otherwise", function(){
					expect(suite.containsPath("missing")).toBeFalsy();
				});

			});

		});

		describe(".collapse()", function(){
			it("Collapse the suite node", function(){
				suite.collapse();
				expect(suiteNode).not.toHaveClass(CONST.CSS_CLASSES.NODE_OPENED);
			});
		});

		describe(".expand()", function(){
			it("Expand the suite node", function(){
				suite.expand();
				expect(suiteNode).toHaveClass(CONST.CSS_CLASSES.NODE_OPENED);
			});
		});

		describe(".getPath()", function(){
			it("Return the full path", function(){
				expect(jQuery.trim(suite.getPath())).toEqual("luga.form");
			});
		});

		describe(".hide()", function(){
			it("Hide the suite node", function(){
				suite.hide();
				expect(suiteNode).not.toBeVisible();
			});
		});

		describe(".show()", function(){
			it("Makes the suite node visible", function(){
				suite.show();
				expect(suiteNode).toBeVisible();
			});
		});

	});

});