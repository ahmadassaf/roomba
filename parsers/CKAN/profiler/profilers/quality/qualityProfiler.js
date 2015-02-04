var profile = require('../profile');

var extend  = require('extend');

function qualityProfiler(parent) {

	extend(this, parent);

	var _               = this.util._;
	var qualityProfiler = this;

	this.start = function start(dataset, profilerCallback) {

		var profileTemplate = new profile(this);

		if (dataset) {
			// There is a valid dataset metadata file (Q1.1)
			profileTemplate.setQualityIndicatorScore("completeness", "QI.1", 1);

			var root   = dataset.result ? dataset.result : dataset;
		}

		function getCompletnessScore() {
			// The serialization formats that should be associated with the resource format
			var serializations = ["application/rdf+xml", "text/turtle", "application/x-ntriples", "application/x-nquads", "application/x-trig"];
		}
		profilerCallback(false, profileTemplate.getProfile());
	}

};

module.exports = qualityProfiler;