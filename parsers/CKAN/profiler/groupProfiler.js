var profile = require('./profile');

var extend  = require('extend');

function groupProfiler(parent) {

	extend(this, parent);

	var groupProfiler   = this;
	var _               = this.util._;

	var aggregateReport = new profile(this);

	this.profileGroup = function profileGroup(profilerCallback) {

		groupProfiler.util.confirm("saveProfiles", groupProfiler.util.options.prompt.saveProfiles, function(saveProfile){
			if (saveProfile) {
				groupProfiler.util.confirm("cachedProfiles", groupProfiler.util.options.prompt.cachedProfiles, function(cachedProfiles){
					start(saveProfile, cachedProfiles);
				});
			} else start(saveProfile);
		});

		function start(saveProfile, cachedProfiles) {
			groupProfiler.crawler.getGroupDetails(function(error, data, message, groupList){
				if (!error)
					groupProfiler.generateGroupProfiles(groupList.result.packages, saveProfile, cachedProfiles, function(error, aggregateReport){
						aggregateReport.prettyPrintAggregationReport();
						/* To Do : The saving process and prompt */
						!error ? profilerCallback(false, false, {type: "info", message: "profilingCompleted"}) : profilerCallback(false, false, {type: "error", message: "profilingFailed"});
					});
			  else profilerCallback(false, false, {type: "info", message: "menuReturn"});
			});
		}
	}

	this.generateGroupProfiles = function generateGroupProfiles(groupList, saveProfile, cachedProfiles, callback) {

		var folderName      = this.datasetsFolder;
		var pace            = require('awesome-progress')({total: groupList.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var profilingErrors = [];

		// Parse through the dataset list items and fetch the corresponding JSON file
		groupProfiler.async.eachLimit(groupList,0.0001,function(item, asyncCallback){

			var fileName = folderName + "/" +  item.name;
			var url      = groupProfiler.url + groupProfiler.API_path + groupProfiler.API_endpoints.dataset_description + item.name;

			// The user does not want to overwrite existing files, so we need to check if the file already exists and skip it
			if (!cachedProfiles) {
				groupProfiler.cache.getCache(groupProfiler.profilesFolder + "/" + item.name, function(error, file){
					if (!error) {
						// cache file has been found successfully, do the needed statistics and aggregations and go to next dataset
						aggregateReport.mergeReports(aggregateReport.getAggregateReport(), file);
						tick();
					} else retreiveProfiles(fileName, url);
				});
			} else retreiveProfiles(fileName, url);

			function retreiveProfiles(fileName, url) {

				var report          = new profile(this);

				groupProfiler.util.download(groupProfiler.cache, fileName, url, function(error, dataset){
					// If the file has been fetched successfully log it into the error.json
					if (error) tick({errors: 1});
						// Checks if the file has been already cached
						else {
							// Start the profiing tasks assigned
							groupProfiler.metadataProfiler.generalProfiler.start(dataset, function(error, generalReport){
								if (!error) groupProfiler.metadataProfiler.ownershipProfiler.start(dataset, function(error, ownershipReport){
									if (!error) groupProfiler.metadataProfiler.provenanceProfiler.start(dataset, function(error, provenanceReport){
										if (!error) groupProfiler.metadataProfiler.accessProfiler.start(dataset, function(error, accessReport, profileChanged, enhancedProfile){
											if (!error) {

												// merge the various metadata reports
												report.mergeReportsUniquely([generalReport, ownershipReport, provenanceReport, accessReport]);
												aggregateReport.mergeReports(aggregateReport.getAggregateReport(), report.getProfile());

												// check if the user has selected he wishes to save the profile and enhanced profile
												if (saveProfile) {
													groupProfiler.cache.setCache(groupProfiler.profilesFolder + item.name, report.getProfile(), function(error){
														if (!error) {
															// check if there is an enhanced profile and the user wishes to save it
															if (profileChanged) {
																groupProfiler.cache.setCache(groupProfiler.enrichedFolder + item.name, enhancedProfile, function(error){
																	if (!error) tick();
																});
															} else tick();
														}
													});
												} else tick();
											} else {
												tick({errors: 1});
												profilingErrors.push(dataset.name);
											}
										});
									});
								});
							});
						}
				});

			}
			function tick(options) {
				// Signal the progress bar and loop the async foreach
				options ? pace.op(options) : pace.op();
				asyncCallback();
			}
		},function(err){
			if (profilingErrors.length > 0 )
				console.log("We couldn't profile the following Datasets: " + profilingErrors);
			// The dataset lists has been successfully parsed, check if there has been any errors and save them to errors.json
			!_.isEmpty(aggregateReport) ? callback(false, aggregateReport) : callback(true,aggregateReport);
		});
	}

}

module.exports = groupProfiler;

