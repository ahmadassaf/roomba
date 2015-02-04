var profile = require('../profile');

var extend  = require('extend');

function provenanceProfiler(parent) {

	extend(this, parent);

	var _                  = this.util._;
	var provenanceProfiler = this;

	this.start      = function start(dataset, profilerCallback) {

		var metadtaKeys     = ["version", "revision_id", "metadata_created", "metadata_modified", "revision_timestamp", "revision_id"];
		var profileTemplate = new profile(this);

		var root            = dataset.result ? dataset.result : dataset;

		var qualityCounter  = profileTemplate.insertKeys(metadtaKeys, root);

		profilerCallback(false, profileTemplate.getProfile());

	}
}

module.exports = provenanceProfiler;