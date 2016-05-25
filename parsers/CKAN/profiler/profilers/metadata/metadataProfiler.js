var generalProfiler    = require('./generalProfiler');
var ownershipProfiler  = require('./ownershipProfiler');
var accessProfiler     = require('./accessProfiler');
var provenanceProfiler = require('./provenanceProfiler');

var extend             = require('extend');

function metadataProfiler(parent) {

	extend(this, parent);

	this.generalProfiler    = new generalProfiler(this);
	this.ownershipProfiler  = new ownershipProfiler(this);
	this.accessProfiler     = new accessProfiler(this);
	this.provenanceProfiler = new provenanceProfiler(this);

};

module.exports = metadataProfiler;