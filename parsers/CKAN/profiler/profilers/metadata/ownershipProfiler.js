var profile = require('../../profile');

var extend  = require('extend');


function ownershipProfiler(parent) {

	extend(this, parent);

	var _                 = this.util._;
	var ownershipProfiler = this;

	this.start      = function start(dataset, profilerCallback) {


		var metadtaKeys     = ["maintainer", "maintainer_email", "owner_org", "author", "author_email", "organization"];
		var profileTemplate = new profile(this);

		var root            = dataset.result ? dataset.result : dataset;
		var dataset_keys    = _.keys(root);

		_.each(metadtaKeys, function(key, index) {
			if (_.has(root, key)) {
				if (!root[key] || _.isEmpty(root[key]))
					profileTemplate.addEntry("undefined", key, key + " field exists but there is no value defined");
			} else profileTemplate.addEntry("missing", key, key + " field is missing");
		});

		// Check the validity of the email addresses provided
		if (_.has(root, "maintainer_email") && root.maintainer_email)
			if (! ownershipProfiler.util.validator.isEmail(root.maintainer_email))
				profileTemplate.addEntry("report", "maintainer_email is not a valid e-mail address !");
		if (_.has(root, "author_email") && root.author_email)
			if (! ownershipProfiler.util.validator.isEmail(root.author_email))
				profileTemplate.addEntry("report", "author_email is not a valid e-mail address !");

		profilerCallback(false, profileTemplate.getProfile());

	}
}

module.exports = ownershipProfiler;