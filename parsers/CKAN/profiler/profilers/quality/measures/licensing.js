var extend  = require('extend');

function licensing(parent, dataset) {

	extend(this, parent);

	var _               = this.util._;
	var licensing       = this;

	this.start = function start(profileTemplate, qualityCallback) {

		var licenseKeys                 = ["license_title", "license_id"];
		var isLicenseURLDereferenceable = false;
		var root                        = dataset.result ? dataset.result : dataset;

		// Check if the dataset has a defined license URL
		if (_.has(root, "license_url") && root.license_url) {
			licensing.util.checkAddress(root.license_url, function(error, body, response) {
				if (!error){
					isLicenseURLDereferenceable = true;
				}
				process();
			}, "HEAD");
		} else process();

		function process() {
			profileTemplate.setQualityIndicatorScore("licensing", "QI.22", (licenseKeys.length - profileTemplate.insertKeys(licenseKeys, root, true)) / 2);
			if (isLicenseURLDereferenceable)
				profileTemplate.setQualityIndicatorScore("licensing", "QI.23", 1);

				// The quality checks have been completed
				qualityCallback(null, profileTemplate);
		}

	}
}

module.exports = licensing;