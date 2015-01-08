var profile = require('../../profile');

var extend  = require('extend');

function provenanceProfiler(parent) {

	extend(this, parent);

	var _                  = this.util._;
	var provenanceProfiler = this;

	this.start      = function start(dataset, profilerCallback) {

		var metadtaKeys     = ["version", "revision_id", "metadata_created", "metadata_modified", "revision_timestamp"];
		var profileTemplate = new profile(this);

		var root            = dataset.result ? dataset.result : dataset;
		var dataset_keys    = _.keys(root);

		_.each(metadtaKeys, function(key, index) {
			if (_.has(root, key)) {
				if (!root[key] || _.isEmpty(root[key]))
					profileTemplate.addEntry("undefined", key, key + " field exists but there is no value defined");
			} else profileTemplate.addEntry("missing", key, key + " field is missing");
		});

		profilerCallback(false, profileTemplate.getProfile());

	}
}

module.exports = provenanceProfiler;