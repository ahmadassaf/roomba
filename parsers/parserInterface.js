function parser(options, util, cache, url) {

	this.options = options;
	this.util    = util;
	this.cache   = cache;
	this.url     = url;
	this.async   = require('async');
}

parser.prototype.start = function start(callback) {

	this.util.console("info", this.constructor.name);
}

parser.prototype.getAction = function getAction(callback) {

	this.util.promptActionList("list", "portalActions",this.options.prompt.actionSelection, this.options.prompt.choiceList, function(answer) {
		callback(answer);
	});
}

/* This function acts as an interface for data portals, those function has to be implemented in each
 * The callback with a true error indicates a return to the main address menu
 * A callback with a false error will return the user back to the main selection menu
 * A suitable error message can be sent with both error and success like {type, message}
 *
 * @method executeAction
 * @param {Object} self:  instance of the callee function class
 * @param {String} action: the user selection from the menu
 * @param {Function} parserCallback: A call back from the callee start function
*/

parser.prototype.executeAction = function(self, action, parserCallback) {

	var actionList =  {

		getAllDatasetsDetails: function ( callback) { self.crawler.getAllDatasetsDetails      ( callback); } ,
		getAllGroupsDetails  : function ( callback) { self.crawler.getAllGroupsDetails        ( callback); } ,
		getGroupdetails      : function ( callback) { self.crawler.getGroupDetails            ( callback); } ,
		getDatasetDetails    : function ( callback) { self.crawler.getDatasetDetails          ( callback); } ,
		portalReport         : function ( callback) { self.reporter.generatePortalReport      ( callback); } ,
		groupReport          : function ( callback) { self.reporter.generateGroupReport       ( callback); } ,
		profileDataset       : function ( callback) { self.profiler.profileDataset            ( callback); } ,
		profileGroup         : function ( callback) { self.profiler.profileGroup              ( callback); } ,
		profileAllDatasets   : function ( callback) { self.profiler.profilePortal             ( callback); } ,
		enrichAllDatasets    : function ( callback) { self.enricher.enrichAllDatasets         ( callback); } ,
		enrichGroupDatasets  : function ( callback) { self.enricher.enrichGroupDatasets       ( callback); } ,
		enrichDataset        : function ( callback) { self.enricher.enrichDataset             ( callback); } ,
	}

	// Check if the user selection doesn't match any of the main default function selections
	if (action !== "exit" && action !== "addressEntry") {
		// Create the cache folder that corresponds to that data portal name
		self.cache.createCacheFolder("/" + self.util.getPortalName(self.url) + "/", function(error, folderName){
				// Execute the selected function, we expect a message with both error or success states
				actionList[action](function(error, fatalError, message) {

					/* Error means that there the API call has failed and we should ask for new selection
					 * A fatalError means that the API call is good but there might have been some error in the execution
					 * False error will send the user back to the list selection, true will send him back to manual address entry
					 * With true errors, a suitable message should be accompanied
					*/
					if (!error) parserCallback(false,message);
						else fatalError ?  parserCallback(true,message) : parserCallback(false,message);
				});
		});
	// Act with the appropriate action based on user selection to exit or return back to main address menu entry
	} else action === "exit" ? process.exit(0) : parserCallback(true, {type: "info" , message: "menuReturn"});
}

parser.prototype.check = function check($) {

	this.util.console("info", "portalCheck");
}


module.exports = parser;