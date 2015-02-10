var extend  = require('extend');

function completeness(parent, dataset) {

	extend(this, parent);

	var _            = this.util._;
	var completeness = this;

	this.start      = function start(profileTemplate, qualityCallback) {

		var resourceKeys   = ["resource_group_id", "cache_last_updated", "revision_timestamp", "webstore_last_updated", "id", "size", "state", "hash", "description", "format", "mimetype_inner", "url-type", "mimetype", "cache_url", "name", "created", "url", "webstore_url", "last_modified", "position", "revision_id", "resource_type" ];
		var tagsKeys       = ["vocabulary_id", "display_name", "name", "revision_timestamp", "state", "id"];
		var groupsKeys     = ["display_name", "description", "title", "image_display_url", "id", "name"];
		var serializations = ["application/rdf+xml", "text/turtle", "application/x-ntriples", "application/x-nquads", "application/x-trig"];
		var exemplaryURLS  = ["example/rdf+xml", "example/turtle", "example/ntriples", "example/x-quads", "example/rdfa", "example/x-trig"];
		var accessPoints   = ["file", "api"];

		var root           = dataset.result ? dataset.result : dataset;

		// Check if the groups object is defined and run the profiling process on its sub-components
		if (root.resources && !_.isEmpty(root.resources)) {

			var dataAccessPoints = [], dataSerializations = [];
			var num_resources    = _.size(root.resources);
			var unreachableURLs  = 0, URLs = 0, inCorrectURLs = 0, inCorrectMIME = 0, inCorrectSize = 0, sizeInformation = 0, MIMEInformation = 0, tagsErrors = 0, groupsErrors = 0;
			var availableAPI     = false, containsExemplaryURL = false;

			/* Variable Explanations
			 *
			 * unreachableURLs: URLs that couldnt be reached via a HTTP HEAD request
			 * URLs: number of URLs defined in the dataset
			 * inCorrectURLs: number of URLs that do not correspond to the HTTP URI scheme
			 * MIMEInformation: number of mimetype field instances for the resources
			 * inCorrectMIME: incorrect mimetype value compared to the content-type value extracted from the HTTP HEAD request
			 * sizeInformation: number of size field instances for the resources
			 * incorrectSize: incorrect size value compared to the content-length value extracted from the HTTP HEAD request
			 * tagsErrors: errors in the general metadata for tags
			 * groupsErrors: errors in the general metadata for groups
			 *
			 */

			if (_.has(root, "url") && root["url"]) URLs++

			// Do the async loop on the resources and do the necessary checks
			completeness.async.eachSeries(root.resources,function(resource, asyncCallback){

				/*  Check the resources format, this is needed to check complete serializations by comparing to the serialization array
				 *  Any checks for format values should be also done here
				 *  Note: this check doesn't require the resource to be de-referenceable (URL hit)
				 */

				if (_.has(resource, "format") && resource.format) {
					if (( _.isString(resource["format"]) && resource["format"].length !== 0)) {
						dataSerializations.push(resource.format);
						// Check if the format contains an exemplary URL
						if (exemplaryURLS.indexOf(resource.format) > -1)
							profileTemplate.setQualityIndicatorScore("comprehensibility", "QI.37", 0);
						// Check if format contains void or dcat which are dataset descriptions vocabularies [format should be meta/void, meta/dcat]
						if (resource.format.indexOf("void") > -1 || resource.format.indexOf("dcat") > -1)
							profileTemplate.setQualityIndicatorScore("completeness", "QI.4", 0);
					}
				}

				/*  Check the resources types, this is needed to check complete available data access points(API, dump)
				 *  Possible resource_type values: file | file.upload | api | visualization | code | documentation
				 *  Note: this check doesn't require the resource to be de-referenceable (URL hit)
				 *  We have to note that the access point should be defined in the resource_type. However, most of the resources have that defined in the format as api/*
				 */

				if (_.has(resource, "resource_type") && resource.resource_type) {
					if (resource.resource_type.indexOf("file") > -1) dataAccessPoints.push("file");
					if (resource.resource_type.indexOf("api") > -1) dataAccessPoints.push("api");
				}

				// Check if there is a url defined and start the connectivity checks and corrections
				if (resource.url) {

					// Count the number of URLs defined for the resources [every resource should have a URL defined]
					URLs++;

					// Check the accessibility of the URLs by making a HEAD HTTP request
					completeness.util.checkAddress(resource.url, function(error, body, response) {
						if (error) {

							// The URL cannot be reached (for example: 404 error), so we increase the counter for unreachable URLs
							unreachableURLs++;
							if (!completeness.util.validator.isURL(resource.url)) inCorrectURLs++;

							if (_.has(resource, "size") && resource["size"]) sizeInformation++;
							if (_.has(resource, "mimetype") && resource["mimetype"]) MIMEInformation++
							// Signal the async callback to switch to the next async.series
							asyncCallback();

						} else {

							/*
							 * The URL has been dereferenced, Check the size and MIME field values
							 * The check we need to do now is related to completeness and availability since the URL is available
							 */

							if (_.has(resource, "size") && resource["size"]) sizeInformation++;
							if (_.has(resource, "mimetype") && resource["mimetype"]) MIMEInformation++

							// check if there is a resource representing a data dump
							if ( (_.has(resource, "description") && resource.description) && resource.description.toLowerCase().indexOf("dump") > -1)
								profileTemplate.setQualityIndicatorScore("availability", "QI.18", 0);
							// Check if there is a resource representing an API
							if (_.has(resource, "resource_type") && resource.resource_type && resource.resource_type.indexOf("api") > -1)
								profileTemplate.setQualityIndicatorScore("availability", "QI.19", 0);

							// Check if we can extract a size and MIME type from the HTTP Head and check if they match the defined values
							if (_.has(resource, "size") && response.headers["content-length"]) {
								if (resource.size !== response.headers["content-length"] ) inCorrectSize++;
							}
							if (_.has(resource, "mimetype") && response.headers["content-type"]) {
								if (resource.mimetype !== response.headers["content-type"].split(';')[0] ) inCorrectMIME++;
							}

							asyncCallback();
						}
					}, "HEAD");
				} else {

					/*
					 * The resource doesn't have a URL defined
					 * Unreachable URLs holds the counter for URLs that do not exist or with connectivity issues
					 * If a resource doesn't have a URL then we check if he has MIME or size information
					 * If it contains MIME and size info, then they are also incorrect as they cannot be checked against a URL
					 */

					unreachableURLs++;

					if (!_.has(resource, "mimetype")) { inCorrectMIME++; MIMEInformation++; }
					if (!_.has(resource, "size")) { inCorrectSize++; sizeInformation++; }

					// execute the Async callback and continue the async.series
					asyncCallback();

				}},function(err){

					// The async.series is finished, aggregate the checks and update the quality report
					var accessPointsNumber   = _.unique(dataAccessPoints).length;
					var serializationsNumber = _.intersection(serializations, _.unique(dataSerializations)).length;

					if (accessPointsNumber < accessPoints.length) {
						profileTemplate.setQualityIndicatorScore("completeness", "QI.3", accessPointsNumber / accessPoints.length);
					}
					if (serializationsNumber < serializations.length) {
						profileTemplate.setQualityIndicatorScore("completeness", "QI.2", serializationsNumber / serializations.length);
					}
					profileTemplate.setQualityIndicatorScore("completeness", "QI.5", (num_resources - sizeInformation) / num_resources);
					profileTemplate.setQualityIndicatorScore("completeness", "QI.6", (num_resources - MIMEInformation) / num_resources);
					profileTemplate.setQualityIndicatorScore("correctness", "QI.25", inCorrectMIME / num_resources);
					profileTemplate.setQualityIndicatorScore("correctness", "QI.26", inCorrectSize / num_resources);


					if (_.has(root, "url")) {
						completeness.util.checkAddress(root.url, function(error, body, response) {
							if (error) {
								unreachableURLs++;
								if (!completeness.util.validator.isURL(root.url)) inCorrectURLs++;
								process();
							} else process();
						});
					} else process();

					// This function is executed to check the tags and categorization infomration aftet the dataset URL check
					function process() {
						// set the number of URLs defined
						profileTemplate.setQualityIndicatorScore("completeness", "QI.9", (num_resources - URLs) / num_resources);
						// Set the number of unreachable URLs in the completenss Score
						profileTemplate.setQualityIndicatorScore("availability", "QI.20", unreachableURLs / URLs);
						// Set the number of syntactically valid URLs in the completenss Score
						profileTemplate.setQualityIndicatorScore("correctness", "QI.28", inCorrectURLs / URLs);
						// Call the series of validation checks i want to run on the dataset
						completeness.async.series([checkTags, checkGroup], function(err){
							profileTemplate.setQualityIndicatorScore("completeness", "QI.7", (groupsErrors + tagsErrors) / 2);
							// Finish the processing and do the callback for the main function
							qualityCallback(null, profileTemplate);
						});

						function checkTags(callback) {

							var tagsError = 0, num_tags = 0;
							// Check if the groups object is defined and run the profiling process on its sub-components
							if (root.tags && !_.isEmpty(root.tags)) {

								_.each(root.tags,function(tag){
									// Loop through the meta keys and check if they are undefined or missing
									tagsError+= profileTemplate.insertKeys(tagsKeys, tag, true);
									num_tags++;
								});

								var totalTagFields = tagsKeys.length * num_tags;
								tagsErrors = (tagsError / totalTagFields);
								callback();
							} else callback();
						}
						function checkGroup(callback) {

							var groupError = 0, num_groups = 0;
							// Check if the groups object is defined and run the profiling process on its sub-components
							if (root.groups && !_.isEmpty(root.groups)) {

								completeness.async.each(root.groups,function(group, asyncCallback){
									// Loop through the meta keys and check if they are undefined or missing
									groupError+= profileTemplate.insertKeys(groupsKeys, group, true);
									num_groups++;
									asyncCallback();

								},function(err){

									var totalGroupFields = groupsKeys.length * num_groups;
									groupsErrors = (groupError / totalGroupFields);

									callback();
								});
							} else callback();
						}
					}
				});

		} else {
		 	// The quality checks have been completed
			qualityCallback(null, profileTemplate);
		}
	}
}

module.exports = completeness;