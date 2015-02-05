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

			var serializations                       = ["application/rdf+xml", "text/turtle", "application/x-ntriples", "application/x-nquads", "application/x-trig"];
			var dataAccessPoints = [], dataSerializations = [];

			_.each(root.resources, function(resource, key) {
				if (_.has(resource, "format") &&  ( _.isString(resource[key]) && resource[key].length !== 0)) dataSerializations.push(resource.format);
				if (_.has(resource, "resource_type")) {
					if (resource.resource_type.indexOf("file") > -1) dataAccessPoints.push("file");
					if (resource.format.indexOf("api") > -1) dataAccessPoints.push("api");
				}
			 });

			console.log(dataAccessPoints);console.log(dataSerializations);

			// accessProfiler.async.eachSeries(root.resources,function(resource, asyncCallback){

			// 	// define the groupID that will be used to identify the report generation
			// 	var resourceID               = resource["name"] || resource["description"] || resource["id"];
			// 	var resourceType             = resource["resource_type"] || null;
			// 	var resourceReport           = new profile(accessProfiler);

			// 	// Add the number of resources to the profile for statistical use
			// 	profileTemplate.setCounter("resource", _.size(root.resources));

			// 	// Loop through the meta keys and check if they are undefined or missing
			// 	resourceReport.insertKeys(resourceKeys, resource);

			// 	// Check if there is a url defined and start the connectivity checks and corrections
			// 	if (resource.url) {
			// 		resourceReport.checkReferencability(accessProfiler.util, resource.url, "The url for this resource is not reachable !", function(error, response){
			// 			if (!error) {

			// 				resource["resource_reachable"] = true;

			// 				if (response["content-length"]) {
			// 					var resource_size = response["content-length"];

			// 					if ( resource.size ) {
			// 						var reportMessage = isAggregate ? "The size for resource is not defined correctly" : "The size for resource is not defined correctly. Provided: " + parseInt(resource.size) + " where the actual size is: " + parseInt(resource_size);
			// 						if (resource.size !== resource_size ) {
			// 							resourceReport.addEntry("report", reportMessage);
			// 						}
			// 					}

			// 					root.resources[root.resources.indexOf(resource)]["size"] = resource_size;
			// 					profileChanged = true;
			// 				}

			// 				if (response["content-type"]) {
			// 					var resource_mimeType = response["content-type"].split(';')[0];

			// 					if ( resource.mimetype ) {
			// 						var reportMessage = isAggregate ? "The mimeType for resource is not defined correctly" : "The mimeType for resource is not defined correctly. Provided: " + resource.mimetype + " where the actual type is: " + resource_mimeType;
			// 						if (resource.mimetype !== resource_mimeType ) {
			// 							resourceReport.addEntry("report", reportMessage);
			// 						}
			// 					}

			// 					root.resources[root.resources.indexOf(resource)]["mimetype"] = resource_mimeType;
			// 					profileChanged = true;
			// 				}
			// 			} else {
			// 				// The resource is not reachebl, but we want to check if there are dummy incorrect values entered
			// 				if (resource.mimetype) {
			// 						resourceReport.addEntry("report", "mimetype value defined where the resource is not reachable");
			// 				}

			// 				if (resource.size) {
			// 					resourceReport.addEntry("report", "size value defined where the resource is not reachable");
			// 				}
			// 			}

			// 			if (!resourceReport.isEmpty()) profileTemplate.addObject(resourceID,resourceReport.getProfile(),"resource");
			// 			asyncCallback();
			// 		}, true, resourceType);
			// 	} else {
			// 		if (!resourceReport.isEmpty()) profileTemplate.addObject(resourceID,resourceReport.getProfile(),"resource");
			// 		asyncCallback();
			// 	}},function(err){ callback() });
			qualityCallback(null, profileTemplate);
		} else {
		 	// The quality checks have been completed
			qualityCallback(null, profileTemplate);
		}
	}
}

module.exports = completeness;