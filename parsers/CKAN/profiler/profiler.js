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

profiler.prototype.profileDataset = function profileDataset(parserInterfaceCallback) {
	this.datasetProfiler.profileDataset(parserInterfaceCallback);
}

profiler.prototype.profilePortal = function profilePortal(parserInterfaceCallback) {
	this.portalProfiler.profilePortal(parserInterfaceCallback);
}

profiler.prototype.profileGroup = function profileGroup(parserInterfaceCallback) {
	this.groupProfiler.profileGroup(parserInterfaceCallback);
}

module.exports = profiler;