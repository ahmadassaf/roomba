var profile = require('../profile');

var extend  = require('extend');


function accessProfiler(parent) {

	extend(this, parent);
	var _               = this.util._;
	var accessProfiler  = this;

	var profileTemplate = new profile(this);
	var profileChanged  = false;

	this.start      = function start(dataset, isAggregate, profilerCallback) {

		var licenseKeys  = ["license_title", "license_id", "license_url"];
		var resourceKeys = ["resource_group_id", "cache_last_updated", "revision_timestamp", "webstore_last_updated", "id", "size", "state", "hash", "description", "format", "mimetype_inner", "url-type", "mimetype", "cache_url", "name", "created", "url", "webstore_url", "last_modified", "position", "revision_id", "resource_type" ];
		var countKeys    = ["num_tags", "num_resources"];

		var root         = dataset.result ? dataset.result : dataset;
		var dataset_keys = _.keys(root);

		// Call the series of validation checks i want to run on the dataset
		accessProfiler.async.series([checkLicenses, resourceProfiling, checkCounts], function(err){
			profilerCallback(false, { "profile" : profileTemplate, "isChanged" : profileChanged, "enhancedProfile" : root});
		});

		function checkLicenses(callback) {


			accessProfiler.CKANUtil.cache.getCache(accessProfiler.util.options.mappingFileName, function(error, mappingFile){
					!error ?  processLicenseInformation(mappingFile) : processLicenseInformation();
			}, "/util/");

			function processLicenseInformation(mappingFile) {

				var licenseReport  = new profile(accessProfiler);

				profileTemplate.addObject("license", {});
				// Loop through the meta keys and check if they are undefined or missing
				licenseReport.insertKeys(licenseKeys, root);

				if (mappingFile) {
						// There is a value defined for the id or for the title, try to disambiguate now
						accessProfiler.async.eachSeries(licenseKeys, function(key, asyncCallback){

						// Only disambiguate if the value is defined
						if (_.has(root, key) && root[key]) {

							disambiguateLicense(root[key], function(error, licenseID) {
								if (!error) {
									// Retreive the license information from the list of available licenses
									accessProfiler.CKANUtil.cache.getCache(licenseID, function(error, normalizedInformation){
										if (!error) {
											// New normalized license information has been found, enhance the profile
											root["license_id"]          = normalizedInformation.id;
											root["license_title"]       = normalizedInformation.title;
											root["license_url"]         = normalizedInformation.url;
											root["license_information"] = _.omit(normalizedInformation,["id", "title", "url"]);

											profileChanged = true;

											// add the appropriate entries to the license report, add the license report and go out
											licenseReport.addEntry("report", "License information has been normalized !");
											profileTemplate.addObject("license",licenseReport.getProfile(),"license");
											callback();
										}
									}, accessProfiler.util.options.licensesFolder + "licenses/");
								} else asyncCallback();
							});
						} else asyncCallback();

						}, function(err){
							licenseReport.addEntry("report", "We could not normalize the license information as no valid mapping was found !");
							profileTemplate.addObject("license",licenseReport.getProfile(),"license");
							callback()
						});
				} else callback();

				// loop through the license mapping files and check if the license information exists there
				function disambiguateLicense(license, callback) {

					accessProfiler.async.eachSeries(mappingFile.mappings, function(mapping, asyncCallback){

						mapIgnoreCase(mapping.license_id, license, function(license_id_error) {
							mapIgnoreCase(mapping.disambiguations, license, function(disambiguations_error) {
								if (!license_id_error || !disambiguations_error) {
									// Check if there are multiple IDs defined, then the user should select which version he wishes
									manualDisambiguation(mapping);
								} else asyncCallback();
							});
						});
					}, function(err){ callback(true) });

					// check for manual disambiguation from user
					function manualDisambiguation(mapping){
						// Check if there are multiple IDs defined, then the user should select which version he wishes
						if (mapping.license_id.length > 1 ) {
							accessProfiler.util.promptActionList("list", "licenseVersion", "[dataset:" + root.title + "] " + accessProfiler.options.prompt.licenceVersion, mapping.license_id, function(value) {
								callback(false, value);
							});
						} else callback(false, mapping.license_id);
					}
					// this function will check if a given license title is found an a set of values ignoring its case
					function mapIgnoreCase(values, license, callback) {
						accessProfiler.async.each(values, function(value, asyncCallback){
							 license.toUpperCase() == value.toUpperCase() ? callback(false) : asyncCallback();
						}, function(err) {
							callback(true);
						});
					}
				}
			}
		}

		function resourceProfiling(callback) {

			// Check if the groups object is defined and run the profiling process on its sub-components
			if (root.resources && !_.isEmpty(root.resources)) {

				// Add the section to profile group information in the profile
				profileTemplate.addObject("resource", {});

				accessProfiler.async.each(root.resources,function(resource, asyncCallback){

					// define the groupID that will be used to identify the report generation
					var resourceID               = resource["name"] || resource["description"] || resource["id"];
					var resourceReport           = new profile(accessProfiler);

					// Add the number of resources to the profile for statistical use
					profileTemplate.augmentCounter("resource", _.size(root.resources));

					// Loop through the meta keys and check if they are undefined or missing
					resourceReport.insertKeys(resourceKeys, resource);

					// Check if there is a url defined and start the connectivity checks and corrections
					if (resource.url) {
						resourceReport.checkReferencability(accessProfiler.util, resource.url, "The url for this resource is not reachable !", function(error, response){
							if (!error) {

								resource["resource_reachable"] = true;

								if (response["content-length"]) {
									var resource_size = response["content-length"];

									if ( resource.size ) {
										var reportMessage = isAggregate ? "The size for resource is not defined correctly" : "The size for resource is not defined correctly. Provided: " + parseInt(resource.size) + " where the actual size is: " + parseInt(resource_size);
										if (resource.size !== resource_size ) {
											resourceReport.addEntry("report", reportMessage);
										}
									}

									root.resources[root.resources.indexOf(resource)]["size"] = resource_size;
									profileChanged = true;
								}

								if (response["content-type"]) {
									var resource_mimeType = response["content-type"].split(';')[0];

									if ( resource.mimetype ) {
										var reportMessage = isAggregate ? "The mimeType for resource is not defined correctly" : "The mimeType for resource is not defined correctly. Provided: " + resource.mimetype + " where the actual type is: " + resource_mimeType;
										if (resource.mimetype !== resource_mimeType ) {
											resourceReport.addEntry("report", reportMessage);
										}
									}

									root.resources[root.resources.indexOf(resource)]["mimetype"] = resource_mimeType;
									profileChanged = true;
								}
							} else {
								// The resource is not reachebl, but we want to check if there are dummy incorrect values entered
								if (resource.mimetype) {
										resourceReport.addEntry("report", "mimetype value defined where the resource is not reachable");
								}

								if (resource.size) {
									resourceReport.addEntry("report", "size value defined where the resource is not reachable");
								}
							}

							if (!resourceReport.isEmpty()) profileTemplate.addObject(resourceID,resourceReport.getProfile(),"resource");
							asyncCallback();
						});
					} else {
						if (!resourceReport.isEmpty()) profileTemplate.addObject(resourceID,resourceReport.getProfile(),"resource");
						asyncCallback();
					}},function(err){ callback() });
			} else {
				// There are no defined resources for this dataset
				profileTemplate.addEntry("missing", "resources", "resources information (API endpoints, downloadable dumpds, etc.) is missing");
			 	callback();
			}
		}

		function checkCounts(callback) {

			_.each(countKeys, function(key){
				// Check if the number of elements is the same as the number defined
				var actualLength = root[key.split("_")[1]] ? root[key.split("_")[1]].length  : 0;

				if (_.has(root, key)) {
					if (root[key] !== actualLength) {
						profileTemplate.addEntry("report", key + " field for this dataset is not correct. Provided: " + parseInt(root[key]) + " where the actual number is: " + actualLength);
						root[key]      = actualLength;
						profileChanged = true;
					}
				} else if (actualLength) {
					root[key]      = actualLength;
					profileChanged = true;
				}
			});
			callback();
		}
	}
}

module.exports = accessProfiler;