var profile = require('../../profile');

var extend  = require('extend');

function generalProfiler(parent) {

	extend(this, parent);

	var _                = this.util._;
	var metadataProfiler = this;

	this.start      = function start(dataset, profilerCallback) {

		var metadtaKeys     = ["private", "id", "state", "type", "name", "isopen", "url", "notes", "title"];
		var groupsKeys      = ["display_name", "description", "title", "image_display_url", "id", "name"];
		var tagsKeys        = ["vocabulary_id", "display_name", "name", "revision_timestamp", "state", "id"];

		var profileTemplate = new profile(this);

		var root            = dataset.result ? dataset.result : dataset;
		var dataset_keys    = _.keys(root);

		_.each(metadtaKeys, function(key, index) {
			if (_.has(root, key)) {
				if (!root[key] || _.isEmpty(root[key]))
					profileTemplate.addEntry("undefined", key, key + " field exists but there is no value defined");
			} else profileTemplate.addEntry("missing", key, key + " field is missing");
		});

		// Check if the groups object is defined and run the profiling process on its sub-components
		if (root.tags && !_.isEmpty(root.tags)) {

			// Add the number of tags to the profile for statistical use
			profileTemplate.augmentCounter("tag", _.size(root.tags));
			// Add the section to profile group information in the profile
			profileTemplate.addObject("tag", {});

			_.each(root.tags,function(tag){

				// define the groupID that will be used to identify the report generation
				var tagID      = tag.display_name || tag.name || tag.ID;
				var tagProfile = new profile(metadataProfiler);

				// Loop through the meta keys and check if they are undefined or missing
				_.each(tagsKeys, function(key, index) {
					if (_.has(tag, key)) {
						if (!tag[key] || _.isEmpty(tag[key]))
							tagProfile.addEntry("undefined", key, key + " field exists but there is no value defined");
					} else tagProfile.addEntry("missing", key, key + " field is missing");
				});

				// Add the tags profiles to the main profile
				profileTemplate.addObject(tagID,tagProfile.getProfile(),"tag");

			});
			profileGroup();

		} else {
			profileTemplate.addEntry("missing", "tag", "Tags information [Tags, Vocabularies] is missing");
			profileGroup();
		}

		function profileGroup() {
			// Check if the groups object is defined and run the profiling process on its sub-components
			if (root.groups && !_.isEmpty(root.groups)) {

				// Add the number of groups to the profile for statistical use
				profileTemplate.augmentCounter("group", _.size(root.groups));
				// Add the section to profile group information in the profile
				profileTemplate.addObject("group", {});

				metadataProfiler.async.each(root.groups,function(group, asyncCallback){

					// define the groupID that will be used to identify the report generation
					var groupID               = group.display_name || group.title || group.ID;
					var groupProfile           = new profile(metadataProfiler);

					// Loop through the meta keys and check if they are undefined or missing
					_.each(groupsKeys, function(key, index) {
						if (_.has(group, key)) {
							if (!group[key] || _.isEmpty(group[key]))
								groupProfile.addEntry("undefined", key, key + " field exists but there is no value defined");
						} else groupProfile.addEntry("missing", key, key + " field is missing");
					});

					if (group.image_display_url) {
						metadataProfiler.util.checkAddress(group.image_display_url, function(error, body) {
							if (error) {
								groupProfile.addEntry("unreachableURLs", group.image_display_url);
								groupProfile.addEntry("report", "The image_display_url defined for this group is not reachable !");
							}
						// do the necessary checks and iterate to the next item in the async
						next();
						}, "HEAD");
					} else next();

					// Check if the group report is not empty and add it to the main profile report
					function next() {
						if (!groupProfile.isEmpty())
							profileTemplate.addObject(groupID,groupProfile.getProfile(),"group");
						asyncCallback();
					}

				},function(err){
					checkReferencability();
				});
			} else {
				profileTemplate.addEntry("missing", "group", "group information is missing. Check organization information as they can be mixed sometimes");
				// Launch the function that will check for the de-referencability of URLs
			  checkReferencability();
			}
		}
		function checkReferencability() {

			metadataProfiler.util.checkAddress(root.url, function(error, body) {
				if (error) {
					profileTemplate.addEntry("report", "The url defined for this dataset is not reachable !");
					if (root.url) {
						profileTemplate.addEntry("unreachableURLs", root.url);
					}
					profilerCallback(false, profileTemplate);
				} else profilerCallback(false, profileTemplate);
			}, "HEAD");
		}

	}
}

module.exports = generalProfiler;

