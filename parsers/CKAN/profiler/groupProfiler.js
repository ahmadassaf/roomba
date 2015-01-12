var profile = require('./profile');

var extend  = require('extend');

function groupProfiler(parent) {

	extend(this, parent);

	var groupProfiler = this;
	var _             = this.util._;

	this.profileGroup = function profileGroup(profilerCallback) {

		groupProfiler.util.confirm("saveProfiles", groupProfiler.util.options.prompt.saveProfiles, function(saveProfile){
			groupProfiler.util.confirm("cachedProfiles", groupProfiler.util.options.prompt.cachedProfiles, function(cachedProfiles){
				groupProfiler.crawler.getGroupDetails(function(error, data, message, groupList){
					if (!error)
						groupProfiler.generateGroupProfiles(groupList.result.packages, saveProfile, cachedProfiles, function(error, aggregateReport){
							console.log(aggregateReport);
							/* To Do : The saving process and prompt */
							!error ? profilerCallback(false, false, {type: "info", message: "profilingCompleted"}) : profilerCallback(false, false, {type: "error", message: "profilingFailed"});
						});
				  else profilerCallback(false, false, {type: "info", message: "menuReturn"});
				});
			});
		});
	}

	this.generateGroupProfiles = function generateGroupProfiles(groupList, saveProfile, cachedProfiles, callback) {

		var folderName      = this.datasetsFolder;
		var pace            = require('awesome-progress')({total: groupList.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var aggregateReport = {};

		// Parse through the dataset list items and fetch the corresponding JSON file
		groupProfiler.async.eachLimit(groupList,0.0001,function(item, asyncCallback){

			var fileName = folderName + "/" +  item.name;
			var url      = groupProfiler.url + groupProfiler.API_path + groupProfiler.API_endpoints.dataset_description + item.name;

			groupProfiler.util.download(groupProfiler.cache, fileName, url, function(error, dataset){
				// If the file has been fetched successfully log it into the error.json
				if (error) tick({errors: 1});

					else if (cachedProfiles) {
						groupProfiler.cache.getCache(item.name, function(error, file){
							if (!error) {
								// cache file has been found successfully, do the needed statistics and aggregations and go to next dataset
								tick();
							} else retreiveProfiles(dataset);
						},groupProfiler.profilesFolder);
					}
			});

			function retreiveProfiles(dataset) {

				var report = new profile(this);

				groupProfiler.metadataProfiler.generalProfiler.start(dataset, function(error, generalReport){
					if (!error) groupProfiler.metadataProfiler.ownershipProfiler.start(dataset, function(error, ownershipReport){
						if (!error) groupProfiler.metadataProfiler.provenanceProfiler.start(dataset, function(error, provenanceReport){
							if (!error) groupProfiler.metadataProfiler.accessProfiler.start(dataset, function(error, accessReport, profileChanged, enhancedProfile){
								if (!error) {

									// merge the various metadata reports
									report.mergeReportsUniquely([generalReport, ownershipReport, provenanceReport, accessReport]);
									// check if the user has selected he wishes to save the profile and enhanced profile
									if (saveProfile) {
										groupProfiler.cache.setCache(groupProfiler.profilesFolder + item.name, report.getProfile(), function(error){
											if (!error) {
												// check if there is an enhanced profile and the user wishes to save it
												if (profileChanged) {
													groupProfiler.cache.setCache(groupProfiler.enrichedFolder + item.name, enhancedProfile, function(error){
														if (!error) {
															//aggregateReport[item.name] = groupProfiler.util.mergeObjects({}, [generalReport, ownershipReport, provenanceReport, accessReport]);
															tick();
														} else tick();
													});
												} else tick();
											} else tick();
										});
									} else tick();
								} else tick();
							});
						});
					});
				});
			}
			function tick(options) {
				// Signal the progress bar and loop the async foreach
				options ? pace.op(options) : pace.op();
				asyncCallback();
			}
		},function(err){
			// The dataset lists has been successfully parsed, check if there has been any errors and save them to errors.json
			!_.isEmpty(aggregateReport) ? callback(false, aggregateReport) : callback(true,aggregateReport);
		});
	}

}

module.exports = groupProfiler;

