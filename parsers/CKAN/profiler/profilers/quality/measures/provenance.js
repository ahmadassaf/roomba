var extend  = require('extend');

function provenance(parent, dataset) {

	extend(this, parent);

	var _               = this.util._;
	var provenance      = this;

	this.start      = function start(profileTemplate, qualityCallback) {

		var fullMetadataKeys        = ["maintainer", "owner_org", "author", "organization", "maintainer_email", "author_email"];
		var ownershipMetadtaKeys    = ["maintainer", "owner_org", "author", "maintainer_email", "author_email"];
		var ownershipDetails        = false;

		var root                    = dataset.result ? dataset.result : dataset;

		var ownershipQualityCounter = profileTemplate.insertKeys(ownershipMetadtaKeys, root, true);

		if (!_.has(root, "organization") || !root.organization) ownershipQualityCounter++;

		checkEmailAddresses(qualityCallback);

		function checkEmailAddresses(callback) {
			// Check the validity of the email addresses provided
			if (_.has(root, "maintainer_email") && root.maintainer_email) {
				if (!profileTemplate.util.validator.isEmail(root.maintainer_email))
					ownershipQualityCounter++;
				else ownershipDetails = true;
			}
			if (_.has(root, "author_email") && root.author_email){
				if (!profileTemplate.util.validator.isEmail(root.author_email))
					ownershipQualityCounter++;
				else ownershipDetails = true;
			}
			profileTemplate.setQualityIndicatorScore("provenance", "QI.44", (( fullMetadataKeys.length - ownershipQualityCounter) / fullMetadataKeys.length));

			var provMetadtaKeys     = ["version", "revision_id"];
			var provQualityCounter  = profileTemplate.insertKeys(provMetadtaKeys, root, true);
			profileTemplate.setQualityIndicatorScore("provenance", "QI.46", ((provMetadtaKeys.length - provQualityCounter) / provMetadtaKeys.length));

			if (ownershipDetails)
				profileTemplate.setQualityIndicatorScore("comprehensibility", "QI.40", 1);

			// The quality checks have been completed
			qualityCallback(null, profileTemplate);
		}
	}
}

module.exports = provenance;