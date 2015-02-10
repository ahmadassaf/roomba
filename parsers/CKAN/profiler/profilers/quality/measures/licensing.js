var extend  = require('extend');

function licensing(parent, dataset) {

	extend(this, parent);

	var _               = this.util._;
	var licensing       = this;

	this.start = function start(profileTemplate, qualityCallback) {

		var licenseKeys                 = ["license_title", "license_id"];
		var isLicenseURLDereferenceable = false, licenseErrors = 0;
		var root                        = dataset.result ? dataset.result : dataset;

		// Check if the dataset has a defined license URL
		if (_.has(root, "license_url") && root.license_url) {
			licensing.util.checkAddress(root.license_url, function(error, body, response) {
				if (!error){
					profileTemplate.setQualityIndicatorScore("licensing", "QI.22", 1);
				}
				process();
			}, "HEAD");
		} else process();

		function process() {

			licensing.CKANUtil.cache.getCache(licensing.util.options.mappingFileName, function(error, mappingFile){
					!error ?  processLicenseInformation(mappingFile) : processLicenseInformation();
			}, "/util/");

			function processLicenseInformation(mappingFile) {

				if (mappingFile) {
						// There is a value defined for the id or for the title, try to disambiguate now
						licensing.async.eachSeries(licenseKeys, function(key, asyncCallback){

						// Only disambiguate if the value is defined
						if (_.has(root, key) && root[key]) {
							disambiguateLicense(root[key], function(error, licenseID) {
								if (!error) {
									// There has been a valid disambiguation
									asyncCallback();
								} else {
									licenseErrors++;
									asyncCallback();
								}
							});
						} else {
							licenseErrors++;
							asyncCallback();
						}

						}, function(err){
							profileTemplate.setQualityIndicatorScore("licensing", "QI.21", ( licenseErrors / licenseKeys.length));
							// The quality checks have been completed
							qualityCallback(null, profileTemplate);
						});
				} else callback();

				// loop through the license mapping files and check if the license information exists there
				function disambiguateLicense(license, callback) {

					licensing.async.eachSeries(mappingFile.mappings, function(mapping, asyncCallback){

						mapIgnoreCase(mapping.license_id, license, function(license_id_error) {
							mapIgnoreCase(mapping.disambiguations, license, function(disambiguations_error) {
								if (!license_id_error || !disambiguations_error) {
									// Check if there are multiple IDs defined, then the user should select which version he wishes
									callback(false);
								} else asyncCallback();
							});
						});
					}, function(err){ callback(true) });

					// this function will check if a given license title is found an a set of values ignoring its case
					function mapIgnoreCase(values, license, callback) {
						licensing.async.each(values, function(value, asyncCallback){
							 license.toUpperCase() == value.toUpperCase() ? callback(false) : asyncCallback();
						}, function(err) {
							callback(true);
						});
					}
				}
			}
		}

	}
}

module.exports = licensing;