var extend  = require('extend');

function freshness(parent, dataset) {

	extend(this, parent);

	var _               = this.util._;
	var freshness       = this;

	this.start      = function start(profileTemplate, qualityCallback) {

		var fullMetadataKeys        = ["metadata_created", "metadata_modified", "revision_timestamp"];
		var resourceMetaKeys        = ["cache_last_updated", "revision_timestamp", "last_modified"];
		var tagMetaKeys             = ["revision_timestamp"];

		var root                    = dataset.result ? dataset.result : dataset;
		var resourcesError          = 0, tagsError = 0, num_tags = 0, num_resources = 0;

		var freshnessQualityCounter = profileTemplate.insertKeys(fullMetadataKeys, root, true);

		// Check if the groups object is defined and run the profiling process on its sub-components
		if (root.resources && !_.isEmpty(root.resources)) {
			_.each(root.resources,function(resource){
				// Loop through the meta keys and check if they are undefined or missing
				resourcesError+= profileTemplate.insertKeys(resourceMetaKeys, resource, true);
				num_resources++;
			});
		}

		// Check if the groups object is defined and run the profiling process on its sub-components
		if (root.tags && !_.isEmpty(root.tags)) {

			_.each(root.tags,function(tag){
				// Loop through the meta keys and check if they are undefined or missing
				tagsError+= profileTemplate.insertKeys(tagMetaKeys, tag, true);
				num_tags++;
			});
		}


		var totalResourcesFields = resourceMetaKeys.length * num_resources;
		var totalTagFields       = tagMetaKeys.length * num_tags;

		var totalResourcesErrors = ((totalResourcesFields - resourcesError) / totalResourcesFields) || 0;
		var totalTagsErrors      = ((totalTagFields - tagsError) / totalTagFields) || 0;

		profileTemplate.setQualityIndicatorScore("freshness", "QI.24", (freshnessQualityCounter + totalResourcesErrors + totalTagsErrors) / 3);

		// The quality checks have been completed
		qualityCallback(null, profileTemplate);
	}
}

module.exports = freshness;