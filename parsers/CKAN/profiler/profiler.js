var datasetProfiler     = require('./datasetProfiler');
var groupProfiler       = require('./groupProfiler');
var portalProfiler      = require('./portalProfiler');

var metadataProfiler    = require('./profilers/metadata/metadataProfiler');
var statisticalProfiler = require('./profilers/statistical/statisticalProfiler');
var topicalProfiler     = require('./profilers/topical/topicalProfiler');

var extend              = require('extend');

function profiler(parent) {

	extend(this, parent);

	this.metadataProfiler    = new metadataProfiler(this);
	this.statisticalProfiler = new statisticalProfiler(this);
	this.topicalProfiler     = new topicalProfiler(this);

	this.datasetProfiler     = new datasetProfiler(this);
	this.groupProfiler       = new groupProfiler(this);
	this.portalProfiler      = new portalProfiler(this);

	this.cache.createCacheFolder(this.profilesFolder, null, false);
	this.cache.createCacheFolder(this.enrichedFolder, null, false);

};

/**
* Profile a dataset list by fetching all the datasets JSON in that list
*
* @method profileDataset
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.profileDataset = function profileDataset(parserInterfaceCallback) {
	this.datasetProfiler.profileDataset(parserInterfaceCallback);
}

/**
* Profile all the datasets in the portal by fetching all the datasets JSON in that list
*
* @method profilePortal
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.profilePortal = function profilePortal(parserInterfaceCallback) {
	this.portalProfiler.profilePortal(parserInterfaceCallback);
}

/**
* Parse a specific group datasets list by fetching all the datasets JSON in that list
*
* @method profileGroup
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.profileGroup = function profileGroup(parserInterfaceCallback) {
	this.groupProfiler.profileGroup(parserInterfaceCallback);
}

module.exports = profiler;