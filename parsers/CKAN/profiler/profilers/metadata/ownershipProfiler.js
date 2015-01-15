var profile = require('../profile');

var extend  = require('extend');


function ownershipProfiler(parent) {

	extend(this, parent);

	var _                 = this.util._;
	var ownershipProfiler = this;

	this.start      = function start(dataset, profilerCallback) {

		var metadtaKeys      = ["maintainer", "maintainer_email", "owner_org", "author", "author_email"];
		var organizationKeys = ["description", "title", "created", "approval_status", "revision_timestamp", "revision_id", "is_organization", "state", "type", "id", "name", "image_url"];

		var profileTemplate  = new profile(this);

		var root             = dataset.result ? dataset.result : dataset;
		var dataset_keys     = _.keys(root);

		profileTemplate.insertKeys(metadtaKeys, root);

		// Call the series of validation checks i want to run on the dataset
		ownershipProfiler.async.series([checkOrganization, checkEmailAddresses, checkURLsConnectivity], function(err){
			profilerCallback(false, profileTemplate.getProfile());
		});

		function checkOrganization(callback) {
			// Check if the groups object is defined and run the profiling process on its sub-components
			if (_.has(root, "organization") && root.organization) {


				// Loop through the meta keys and check if they are undefined or missing
				_.each(organizationKeys, function(key, index) {
					// give specific names for organization fields to differentiate them from general metadata keys
					var entryKey = key == "is_organization" ? "is_organization" : "organization_" + key;

					if (_.has(root.organization, key)) {
						if (!root.organization[key] || _.isEmpty(root.organization[key])) {
							profileTemplate.addEntry("undefined", entryKey, entryKey + " field exists but there is no value defined");
						}
					} else profileTemplate.addEntry("missing", entryKey, entryKey + " field is missing");
				});

			} else profileTemplate.addEntry("missing", "organization", "organization information is missing");

			callback();
		}

		function checkEmailAddresses(callback) {
			// Check the validity of the email addresses provided
			if (_.has(root, "maintainer_email") && root.maintainer_email) {
				if (! ownershipProfiler.util.validator.isEmail(root.maintainer_email))
					profileTemplate.addEntry("report", "maintainer_email is not a valid e-mail address !");
			}
			if (_.has(root, "author_email") && root.author_email){
				if (! ownershipProfiler.util.validator.isEmail(root.author_email))
					profileTemplate.addEntry("report", "author_email is not a valid e-mail address !");
			}
			callback();
		}

		function checkURLsConnectivity(callback){
			// Check if the image_url field for organization is referenceable
			if (_.has(root, "organization") && _.has(root.organization, "image_url") && root.organization.image_url) {
				profileTemplate.checkReferencability(ownershipProfiler.util, root.organization.image_url, "The organization image_url defined for this dataset is not reachable !", function(){
					callback(); });
			} else callback();
		}
	}
}

module.exports = ownershipProfiler;