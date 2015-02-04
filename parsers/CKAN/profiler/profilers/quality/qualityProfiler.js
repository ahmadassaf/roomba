var profile = require('../profile');

var extend  = require('extend');

function qualityProfiler(parent) {

	extend(this, parent);

	var _               = this.util._;
	var qualityProfiler = this;
	var profileTemplate = new profile(this);

	this.start = function start(dataset, profilerCallback) {

		if (dataset) {

			// There is a valid dataset metadata file (Q1.1)
			profileTemplate.setQualityIndicatorScore("completeness", "QI.1", 1);

			var root   = dataset.result ? dataset.result : dataset;

			// Call the series of validation checks i want to run on the dataset
			qualityProfiler.async.series([provenanceQuality], function(err){
				console.log(profileTemplate.getQualityProfile());
				profilerCallback(false, profileTemplate.getProfile());
			});

			function provenanceQuality(callback) {

				var fullMetadataKeys = ["maintainer", "owner_org", "author", "organization", "maintainer_email", "author_email"];
				var metadtaKeys      = ["maintainer", "owner_org", "author", "maintainer_email", "author_email"];
				var root             = dataset.result ? dataset.result : dataset;

				var qualityCounter   = profileTemplate.insertKeys(metadtaKeys, root, true);

				if (!_.has(root, "organization") || !root.organization) qualityCounter++;

				checkEmailAddresses(callback);

				function checkEmailAddresses(callback) {
					// Check the validity of the email addresses provided
					if (_.has(root, "maintainer_email") && root.maintainer_email) {
						if (! profileTemplate.util.validator.isEmail(root.maintainer_email))
							qualityCounter++;
					}
					if (_.has(root, "author_email") && root.author_email){
						if (! profileTemplate.util.validator.isEmail(root.author_email))
							qualityCounter++;
					}
					console.log(qualityCounter);
					profileTemplate.setQualityIndicatorScore("Provenance", "QI.40", (( fullMetadataKeys.length - qualityCounter) / fullMetadataKeys.length));
					callback();
				}
			}

			function completenessQuality(callback) {

				// The serialization formats that should be associated with the resource format
				var serializations = ["application/rdf+xml", "text/turtle", "application/x-ntriples", "application/x-nquads", "application/x-trig"];

			}

		} else profilerCallback(false, profileTemplate.getProfile());
	}
};

module.exports = qualityProfiler;