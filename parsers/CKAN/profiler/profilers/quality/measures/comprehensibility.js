var extend  = require('extend');

function comprehensibility(parent, dataset) {

	extend(this, parent);

	var _               = this.util._;
	var comprehensibility       = this;

	this.start      = function start(profileTemplate, qualityCallback) {

		var fullMetadataKeys              = ["id", "type", "name", "title"];
		var groupMetaKeys                 = ["display_name", "description", "title", "id", "name"]
		var resourceMetaKeys              = ["description", "format", "id", "name"];
		var tagMetaKeys                   = ["display_name", "name"];

		var root                          = dataset.result ? dataset.result : dataset;
		var resourcesError                = 0, tagsError = 0, groupsError = 0, num_tags = 0, num_groups = 0, num_resources = 0;

		var comprehnsbilityQualityCounter = profileTemplate.insertKeys(fullMetadataKeys, root, true);

		// Check if the resources object is defined and run the profiling process on its sub-components
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

		// Check if the groups object is defined and run the profiling process on its sub-components
		if (root.groups && !_.isEmpty(root.groups)) {

			_.each(root.groups,function(group){
				// Loop through the meta keys and check if they are undefined or missing
				groupsError+= profileTemplate.insertKeys(groupMetaKeys, group, true);
				num_groups++;
			});
		}

		var totalResourcesFields = resourceMetaKeys.length * num_resources;
		var totalTagFields       = tagMetaKeys.length * num_tags;
		var totalGroupsFields    = groupMetaKeys.length * num_groups;

		var totalResourcesErrors = ((totalResourcesFields - resourcesError) / totalResourcesFields) || 0;
		var totalTagsErrors      = ((totalTagFields - tagsError) / totalTagFields) || 0 ;
		var totalGroupsError     = ((totalGroupsFields - groupsError) / totalGroupsFields) || 0;

		profileTemplate.setQualityIndicatorScore("comprehensibility", "QI.39", (comprehnsbilityQualityCounter + totalGroupsError + totalResourcesErrors + totalTagsErrors) / 4);

		// The quality checks have been completed
		qualityCallback(null, profileTemplate);
	}
}

module.exports = comprehensibility;