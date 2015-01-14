var reportGenerator = require('./reportGenerator');
var reportFactory   = require('./reportFactory');

var extend          = require('extend');

function profiler(parent) {

	extend(this, parent);

	this.reportFactory      = new reportFactory(this);
	this.reportGenerator    = new reportGenerator(this);

	this.cache.createCacheFolder(this.reportsFolder, null, false);

};

/**
* Generate a portal-wide report by aggregating all the dataset reports in the portal
*
* @method generatePortalReport
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.generatePortalReport = function generatePortalReport(parserInterfaceCallback) {
	this.reportGenerator.generatePortalReport(parserInterfaceCallback);
}

/**
* Generate a group-wide report by aggregating all the dataset reports in that group
*
* @method generateGroupReport
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.generateGroupReport = function generateGroupReport(parserInterfaceCallback) {
	this.reportGenerator.generateGroupReport(parserInterfaceCallback);
}

module.exports = profiler;