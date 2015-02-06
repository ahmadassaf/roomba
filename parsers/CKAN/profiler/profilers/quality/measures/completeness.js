var extend  = require('extend');

function completeness(parent, dataset) {

	extend(this, parent);

	var _            = this.util._;
	var completeness = this;

	this.start      = function start(profileTemplate, qualityCallback) {

		var resourceKeys = ["resource_group_id", "cache_last_updated", "revision_timestamp", "webstore_last_updated", "id", "size", "state", "hash", "description", "format", "mimetype_inner", "url-type", "mimetype", "cache_url", "name", "created", "url", "webstore_url", "last_modified", "position", "revision_id", "resource_type" ];
		var countKeys    = ["num_tags", "num_resources"];
		var root         = dataset.result ? dataset.result : dataset;

		// Check if the groups object is defined and run the profiling process on its sub-components
		if (root.resources && !_.isEmpty(root.resources)) {

			var serializations   = ["application/rdf+xml", "text/turtle", "application/x-ntriples", "application/x-nquads", "application/x-trig"];
			var accessPoints     = ["file", "api"];
			var dataAccessPoints = [], dataSerializations = [];
			var num_resources    = 0, unreachableURLs = 0, URLs = 0; inCorrectMIME = 0, inCorrectSize = 0, sizeInformation = 0, MIMEInformation = 0, tagsErrors = 0, groupsErrors = 0;
			var containsVOID     = false;

			// Do the async loop on the resources and do the necessary checks
			completeness.async.eachSeries(root.resources,function(resource, asyncCallback){

				// Add the number of resources to the profile for statistical use
				num_resources    = _.size(root.resources);

				if (_.has(resource, "format")) {
					if (( _.isString(resource["format"]) && resource["format"].length !== 0)) {
						dataSerializations.push(resource.format);
						if (resource.format.indexOf("void") > -1 || resource.format.indexOf("dcat") > -1) containsVOID = true;
					}
				}
				if (_.has(resource, "resource_type")) {
					if (resource.resource_type.indexOf("file") > -1) dataAccessPoints.push("file");
					if (resource.resource_type.indexOf("api") > -1) dataAccessPoints.push("api");
				}

				// Check if there is a url defined and start the connectivity checks and corrections
				if (resource.url) {

					URLs++;

					completeness.util.checkAddress(resource.url, function(error, body, response) {
						if (error) {
							unreachableURLs++;
							if (_.has(resource, "size")) {
								if (_.isUndefined(resource["size"]) || _.isNull(resource["size"]) || ( _.isString(resource["size"]) && resource["size"].length == 0)) {
									sizeInformation++;
								} else sizeInformation++;
							}
							if (_.has(resource, "mimetype")) {
								if (_.isUndefined(resource["mimetype"]) || _.isNull(resource["mimetype"]) || ( _.isString(resource["mimetype"]) && resource["mimetype"].length == 0)) {
									MIMEInformation++;
								}
							} else MIMEInformation++;
							asyncCallback();
						} else {

							if (_.has(resource, "size")) {
								if (_.isUndefined(resource["size"]) || _.isNull(resource["size"]) || ( _.isString(resource["size"]) && resource["size"].length == 0)) {
									inCorrectSize++;
									sizeInformation++;
								} else if (response["content-length"]) {
									var resource_size = response["content-length"];
									if (resource.size !== resource_size ) inCorrectSize++;
								}
							} else sizeInformation++;

							if (_.has(resource, "mimetype")) {
								if (_.isUndefined(resource["mimetype"]) || _.isNull(resource["mimetype"]) || ( _.isString(resource["mimetype"]) && resource["mimetype"].length == 0)) {
									inCorrectMIME++;
									MIMEInformation++;
								} else if (response["content-type"]) {
									var resource_mimeType = response["content-type"].split(';')[0];
									if (resource.mimetype !== resource_mimeType ) inCorrectMIME++;
								}
							} else MIMEInformation++;

							asyncCallback();
						}
					}, "HEAD");
				} else {

					if (!_.has(resource, "mimetype")) MIMEInformation++;
					if (!_.has(resource, "size")) sizeInformation++;

					asyncCallback();

				}},function(err){

					var accessPointsNumber   = _.unique(dataAccessPoints).length;
					var serializationsNumber = _.intersection(serializations, _.unique(dataSerializations)).length;

					if (accessPointsNumber < accessPoints.length) {
						profileTemplate.setQualityIndicatorScore("completeness", "QI.3", (accessPoints.length - accessPointsNumber) / accessPoints.length);
					}
					if (serializationsNumber < serializations.length) {
						profileTemplate.setQualityIndicatorScore("completeness", "QI.2", (serializations.length - serializationsNumber) / serializations.length);
					}
					if (containsVOID) profileTemplate.setQualityIndicatorScore("completeness", "QI.4", 1);

					if (_.has(root, "url")) {
						if (!_.isUndefined(root["url"]) && !_.isNull(root["url"]) && ( _.isString(root["url"]) && !root["url"].length == 0)) URLs++;
					}

					profileTemplate.setQualityIndicatorScore("completeness", "QI.5", (num_resources - sizeInformation) / num_resources);
					profileTemplate.setQualityIndicatorScore("completeness", "QI.6", (num_resources - MIMEInformation) / num_resources);
					profileTemplate.setQualityIndicatorScore("completeness", "QI.9", (URLs) / ++num_resources);

					// Call the series of validation checks i want to run on the dataset
					completeness.async.series([checkTags, checkGroup], function(err){
						profileTemplate.setQualityIndicatorScore("completeness", "QI.7", (groupsErrors + tagsErrors) / 2);
						// Finish the processing and do the callback for the main function
						qualityCallback(null, profileTemplate);
					});

					function checkTags(callback) {
						var tagsKeys  = ["vocabulary_id", "display_name", "name", "revision_timestamp", "state", "id"];
						var tagsError = 0, num_tags = 0;
						// Check if the groups object is defined and run the profiling process on its sub-components
						if (root.tags && !_.isEmpty(root.tags)) {

							_.each(root.tags,function(tag){
								// Loop through the meta keys and check if they are undefined or missing
								tagsError+= profileTemplate.insertKeys(tagsKeys, tag, true);
								num_tags++;
							});

							var totalTagFields = tagsKeys.length * num_tags;
							tagsErrors = ((totalTagFields - tagsError) / totalTagFields);
							callback();
						} else callback();
					}
					function checkGroup(callback) {
						var groupsKeys = ["display_name", "description", "title", "image_display_url", "id", "name"];
						var groupError = 0, num_groups = 0;
						// Check if the groups object is defined and run the profiling process on its sub-components
						if (root.groups && !_.isEmpty(root.groups)) {

							completeness.async.each(root.groups,function(group, asyncCallback){
								// Loop through the meta keys and check if they are undefined or missing
								groupError+= profileTemplate.insertKeys(groupsKeys, group, true);
								num_groups++;

								completeness.util.checkAddress(url, function(error, body, response) {
									if (error) {
										groupError++;
										asyncCallback();
									} else asyncCallback();
								}, "HEAD");
							},function(err){

								var totalGroupFields = groupsKeys.length * num_num_groupstags;
								groupsErrors = ((totalGroupFields - groupError) / totalGroupFields);

								callback();
							});
						} else callback();
					}

				});

		} else {
		 	// The quality checks have been completed
			qualityCallback(null, profileTemplate);
		}
	}
}

module.exports = completeness;