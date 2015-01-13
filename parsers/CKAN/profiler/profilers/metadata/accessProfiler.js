var profile = require('../../profile');

var extend  = require('extend');


function accessProfiler(parent) {

	extend(this, parent);
	var _               = this.util._;
	var accessProfiler  = this;

	var profileTemplate = new profile(this);
	var profileChanged  = false;

	this.start      = function start(dataset, profilerCallback) {

		var root            = dataset.result ? dataset.result : dataset;
		var dataset_keys    = _.keys(root);

		// Check the license information if they are correct and then do a check on the resources if they exist
		this.licenseProfiling(root, function(error, licenseReport){
			if (!error) {
				if (!licenseReport.isEmpty()) {
					profileTemplate.addObject("license", {});
					profileTemplate.addObject("license",licenseReport.getProfile(),"license");
				}
				// Check if the groups object is defined and run the profiling process on its sub-components
				if (root.resources && !_.isEmpty(root.resources)) {

					// Add the number of resources to the profile for statistical use
					profileTemplate.augmentCounter("resource", _.size(root.resources));

					accessProfiler.resourceProfiling(root, function(error, profiler, dataset) {
						if (!error) profilerCallback(false, profileTemplate, profileChanged, root);
					});
				} else {
					// There are no defined resources for this dataset
					profileTemplate.addEntry("missing", "resources", "resources information (API endpoints, downloadable dumpds, etc.) is missing");
				  profilerCallback(false, profileTemplate, profileChanged, dataset);
				}
			}
		});
	}

	this.licenseProfiling  = function licenseProfiling(root, callback) {


		accessProfiler.CKANUtil.cache.getCache(accessProfiler.util.options.mappingFileName, function(error, mappingFile){
				!error ?  processLicenseInformation(mappingFile) : processLicenseInformation();
		}, "/util/");

		function processLicenseInformation(mappingFile) {

		var metadtaKeys    = ["license_title", "license_id"];
		var licenseReport  = new profile(accessProfiler);



		// Loop through the meta keys and check if they are undefined or missing
		_.each(metadtaKeys, function(key, index) {
			if (!_.has(root, key) || !root[key] || _.isEmpty(root[key])) {
					licenseReport.addEntry("undefined", key, key + " field exists but there is no value defined");
			} else licenseReport.addEntry("missing", key, key + " information is missing for this dataset");
		});

			if (mappingFile) {
					// There is a value defined for the id or for the title, try to disambiguate now
					accessProfiler.async.eachSeries(metadtaKeys, function(key, asyncCallback){

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

											licenseReport.addEntry("report", "License information has been normalized !");
											profileChanged = true;
											callback(false, licenseReport);
										}
										else {
											licenseReport.addEntry("report", "We could not find matching license information to normalize !");
											callback(false, licenseReport);
										}
								}, accessProfiler.util.options.licensesFolder + "licenses/");
							} else asyncCallback();
						});
					} else asyncCallback();

					}, function(err){
						licenseReport.addEntry("report", "We could not normalize the license information as no valid mapping was found !");
						callback(false, licenseReport);
					});
			} else {
				licenseReport.addEntry("report", "We could not normalize the license information as no mapping file was found !");
				callback(false, licenseReport);
			}


			// loop through the license mapping files and check if the license information exists there
			function disambiguateLicense(license, callback) {

				accessProfiler.async.eachSeries(mappingFile.mappings, function(mapping, asyncCallback){
				mapIgnoreCase(mapping.license_id, license, function(error) {
					if (!error) {
						// Check if there are multiple IDs defined, then the user should select which version he wishes
						if (mapping.license_id.length > 1 ) {
							accessProfiler.util.promptActionList("list", "licenseVersion", accessProfiler.options.prompt.licenceVersion, mapping.license_id, function(value) {
									callback(false, value);
							});
						} else callback(false, mapping.license_id);
					}
					else {
						mapIgnoreCase(mapping.disambiguations, license, function(error) {
							if (!error) {
								// Check if there are multiple IDs defined, then the user should select which version he wishes
								if (mapping.license_id.length > 1 ) {
									accessProfiler.util.promptActionList("list", "licenseVersion", accessProfiler.options.prompt.licenceVersion, mapping.license_id, function(value) {
									callback(false, value);
									});
								} else callback(false, mapping.license_id);
							} else asyncCallback();
						});
					}
				});
				}, function(err){ callback(true) });

				// this function will check if a given license title is found an a set of values ignoring its case
				function mapIgnoreCase(values, license, callback) {
					accessProfiler.async.each(values, function(value, asyncCallback){
						 license.toUpperCase() == value.toUpperCase() ? callback(false) : asyncCallback();
					}, function(err) { callback(true) });
				}
			}
		}
	}

	this.resourceProfiling = function resourceProfiling(root, callback) {

		var metadtaKeys = ["resource_group_id", "cache_last_updated", "revision_timestamp", "webstore_last_updated", "id", "size", "state", "hash", "description", "format", "mimetype_inner", "url-type", "mimetype", "cache_url", "name", "created", "url", "webstore_url", "last_modified", "position", "revision_id", "resource_type" ];

		// Add the section to profile group information in the profile
		profileTemplate.addObject("resource", {});

		accessProfiler.async.each(root.resources,function(resource, asyncCallback){

			// define the groupID that will be used to identify the report generation
			var resourceID               = resource["name"] || resource["description"] || resource["id"];
			var resourceReport           = new profile(accessProfiler);

			// Loop through the meta keys and check if they are undefined or missing
			_.each(metadtaKeys, function(key, index) {
				if (_.has(resource, key)) {
					if (!resource[key] || _.isEmpty(resource[key]))
						resourceReport.addEntry("undefined", key, key  + " field exists but there is no value defined");
				} else resourceReport.addEntry("missing", key, key + " field is missing");
			});

			// Check if there is a url defined and start the connectivity checks and corrections
			if (resource.url) {
				accessProfiler.util.checkAddress(resource.url, function(error, body, response) {
					if (error) {
						resourceReport.addEntry("unreachableURLs", resource.url);
						resourceReport.addEntry("report", "The url for this resource is not reachable !");
						// Augment new field to the resource metadata file to indicate that the resource is not reachable
						resource["resource_reachable"] = false;
					} else if (response.headers["content-length"] || response.headers["content-type"]) {

						// The url is de-referenced correctly, we need to check if some values are defined correctly
						var resource_size, resource_mimeType;

						if (response.headers["content-length"]) {

							resource_size = response.headers["content-length"];

							// Check if the resource size is correct
							if ((resource.size && resource.size !== resource_size) || !resource.size)
								resourceReport.addEntry("report", "The size for resource is not defined correctly. Provided: " + parseInt(resource.size) + " where the actual size is: " + parseInt(resource_size));
						}

						if (response.headers["content-type"]) {

							resource_mimeType = response.headers["content-type"].split(';')[0];

							// check if the mimeType is correct
							if ( (resource.mimetype && resource.mimetype !== resource_mimeType) || !resource.mimetype)
								resourceReport.addEntry("report", "The mimeType for resource is not defined correctly. Provided: " + resource.mimetype + " where the actual type is: " + resource_mimeType);
						}

						// correct the values with the actual ones
						resource.size     = resource_size;
						resource.mimetype = resource_mimeType;
						// indicate that the resource is reachable
						resource["resource_reachable"] = true;
						profileChanged = true;
					}
					next();
				});
			} else next();

			// do the necessary checks and iterate to the next item in the async
			function next() {
				if (!resourceReport.isEmpty()) profileTemplate.addObject(resourceID,resourceReport.getProfile(),"resource");
				asyncCallback();
			}

		},function(err){
				// Check if the resources number matches the actual number
	  		checkResourcesNumber(function(error){
	  			if (!error) callback(false, profileTemplate.getProfile(), root);
	  		});
		});

		function checkResourcesNumber(callback) {
			// Check if the number of resources is the same as the number of resources defined
			if (_.has(root, "num_resources")) {
				if (root.num_resources !== root.resources.length)
					profileTemplate.addEntry("report", "num_resources field for this dataset is not correct. Provided: " + parseInt(root.num_resources) + " where the actual number is: " + parseInt(root.resources.length));
			} else profileTemplate.addEntry("missing", "num_resources", "num_resources field is missing");
			callback(false);
		}
	}
}

module.exports = accessProfiler;