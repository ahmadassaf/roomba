var profile = require('../../profile');

var extend  = require('extend');

function generalProfiler(parent) {

	extend(this, parent);

	var _                = this.util._;
	var generalProfiler  = this;

	this.start      = function start(dataset, profilerCallback) {

		var metadtaKeys     = ["private", "id", "state", "type", "name", "isopen", "url", "notes", "title"];
		var groupsKeys      = ["display_name", "description", "title", "image_display_url", "id", "name"];
		var tagsKeys        = ["vocabulary_id", "display_name", "name", "revision_timestamp", "state", "id"];

		var profileTemplate = new profile(this);

		var root            = dataset.result ? dataset.result : dataset;
		var dataset_keys    = _.keys(root);

		profileTemplate.insertKeys(metadtaKeys, root);
		// Call the series of validation checks i want to run on the dataset
		generalProfiler.async.series([checkTags, checkGroup, checkURLsConnectivity], function(err){
			profilerCallback(false, profileTemplate);
		});

		function checkTags(callback) {
			// Check if the groups object is defined and run the profiling process on its sub-components
			if (root.tags && !_.isEmpty(root.tags)) {

				// Add the number of tags to the profile for statistical use
				profileTemplate.augmentCounter("tag", _.size(root.tags));
				// Add the section to profile group information in the profile
				profileTemplate.addObject("tag", {});

				_.each(root.tags,function(tag){

					// define the groupID that will be used to identify the report generation
					var tagID      = tag.display_name || tag.name || tag.ID;
					var tagProfile = new profile(generalProfiler);

					// Loop through the meta keys and check if they are undefined or missing
					tagProfile.insertKeys(tagsKeys, tag);
					// Add the tags profiles to the main profile
					profileTemplate.addObject(tagID,tagProfile.getProfile(),"tag");

				});

				callback();

			} else {
				profileTemplate.addEntry("missing", "tag", "Tags information [Tags, Vocabularies] is missing");
				callback();
			}
		}

		function checkGroup(callback) {
			// Check if the groups object is defined and run the profiling process on its sub-components
			if (root.groups && !_.isEmpty(root.groups)) {

				// Add the number of groups to the profile for statistical use
				profileTemplate.augmentCounter("group", _.size(root.groups));
				// Add the section to profile group information in the profile
				profileTemplate.addObject("group", {});

				generalProfiler.async.each(root.groups,function(group, asyncCallback){

					// define the groupID that will be used to identify the report generation
					var groupID      = group.display_name || group.title || group.ID;
					var groupProfile = new profile(generalProfiler);

					// Loop through the meta keys and check if they are undefined or missing
					groupProfile.insertKeys(groupsKeys, group);

					if (group.image_display_url) {
						groupProfile.checkReferencability(generalProfiler.util, group.image_display_url, "The image_display_url defined for this group is not reachable !", function(){
							nextAsync();
						});
					} else nextAsync();

					function nextAsync() {
						if (!groupProfile.isEmpty()) {
								profileTemplate.addObject(groupID,groupProfile.getProfile(),"group");
							}
						asyncCallback();
					}

				},function(err){ callback() });
			} else {
				profileTemplate.addEntry("missing", "group", "group information is missing. Check organization information as they can be mixed sometimes");
				// Launch the function that will check for the de-referencability of URLs
			  callback();
			}
		}

		function checkURLsConnectivity(callback) {
			if (root.url) {
				profileTemplate.checkReferencability(generalProfiler.util, root.url, "The url defined for this dataset is not reachable !", function(){
					callback() });
			} else callback();
		}

	}
}

module.exports = generalProfiler;

