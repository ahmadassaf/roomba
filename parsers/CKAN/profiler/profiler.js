var datasetProfiler     = require('./datasetProfiler');
var groupProfiler       = require('./groupProfiler');
var portalProfiler      = require('./portalProfiler');

var metadataProfiler    = require('./profilers/metadata/metadataProfiler');
var statisticalProfiler = require('./profilers/statistical/statisticalProfiler');
var topicalProfiler     = require('./profilers/topical/topicalProfiler');
var qualityProfiler     = require('./profilers/quality/qualityProfiler');

var extend              = require('extend');

function profiler(parent) {

	extend(this, parent);

	this.metadataProfiler    = new metadataProfiler(this);
	this.statisticalProfiler = new statisticalProfiler(this);
	this.topicalProfiler     = new topicalProfiler(this);
	this.qualityProfiler     = new qualityProfiler(this);

	this.datasetProfiler     = new datasetProfiler(this);
	this.groupProfiler       = new groupProfiler(this);
	this.portalProfiler      = new portalProfiler(this);

	this.cache.createCacheFolder(this.profilesFolder, null, false);
	this.cache.createCacheFolder(this.enrichedFolder, null, false);
	this.cache.createCacheFolder(this.qualityFolder , null, false);

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
* Profile a dataset list by fetching all the datasets JSON in that list
*
* @method profileDatasetQuality
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.profileDatasetQuality = function profileDatasetQuality(parserInterfaceCallback) {
	this.datasetProfiler.profileDataset(parserInterfaceCallback, true);
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
* Profile all the datasets in the portal by fetching all the datasets JSON in that list
*
* @method profilePortal
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.profilePortalQuality = function profilePortalQuality(parserInterfaceCallback) {
	this.portalProfiler.profilePortal(parserInterfaceCallback, true);
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

/**
* Parse a specific group datasets list by fetching all the datasets JSON in that list
*
* @method profileGroup
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
profiler.prototype.profileGroupQuality = function profileGroupQuality(parserInterfaceCallback) {
	this.groupProfiler.profileGroup(parserInterfaceCallback, true);
}

module.exports = profiler;