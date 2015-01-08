var reportGenerator = require('./reportGenerator');
var reportFactory   = require('./reportFactory');

var extend          = require('extend');

function profiler(parent) {

	extend(this, parent);

	this.reportFactory      = new reportFactory(this);
	this.reportGenerator    = new reportGenerator(this);

	this.cache.createCacheFolder(this.reportsFolder, null, false);

};

profiler.prototype.generatePortalReport = function generatePortalReport(parserInterfaceCallback) {
	this.reportGenerator.generatePortalReport(parserInterfaceCallback);
}

profiler.prototype.generateGroupReport = function generateGroupReport(parserInterfaceCallback) {
	this.reportGenerator.generateGroupReport(parserInterfaceCallback);
}

module.exports = profiler;