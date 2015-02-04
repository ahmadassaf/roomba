var profile = require('../profile');

var extend  = require('extend');

function completeness(parent, dataset) {

	extend(this, parent);

	var _            = this.util._;
	var completeness = this;

	this.start      = function start(profileTemplate, qualityCallback) {

		var fullMetadataKeys        = ["maintainer", "owner_org", "author", "organization", "maintainer_email", "author_email"];
		var ownershipMetadtaKeys    = ["maintainer", "owner_org", "author", "maintainer_email", "author_email"];
		var root                    = dataset.result ? dataset.result : dataset;

		var ownershipQualityCounter = profileTemplate.insertKeys(ownershipMetadtaKeys, root, true);

		if (!_.has(root, "organization") || !root.organization) ownershipQualityCounter++;

		checkEmailAddresses(qualityCallback);

		function checkEmailAddresses(callback) {
			// Check the validity of the email addresses provided
			if (_.has(root, "maintainer_email") && root.maintainer_email) {
				if (! profileTemplate.util.validator.isEmail(root.maintainer_email))
					ownershipQualityCounter++;
			}
			if (_.has(root, "author_email") && root.author_email){
				if (! profileTemplate.util.validator.isEmail(root.author_email))
					ownershipQualityCounter++;
			}
			profileTemplate.setQualityIndicatorScore("completeness", "QI.2", (( fullMetadataKeys.length - ownershipQualityCounter) / fullMetadataKeys.length));

			var provMetadtaKeys     = ["version", "revision_id", "metadata_created", "metadata_modified", "revision_timestamp", "revision_id"];
			var provQualityCounter  = profileTemplate.insertKeys(provMetadtaKeys, root, true);
			profileTemplate.setQualityIndicatorScore("completeness", "QI.3", ((provMetadtaKeys.length - provQualityCounter) / provMetadtaKeys.length));

			callback(null, profileTemplate);
		}
	}
}

module.exports = completeness;