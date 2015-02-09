var profile = require('./profilers/profile');

var extend  = require('extend');

function groupProfiler(parent) {

	extend(this, parent);

	var groupProfiler   = this;
	var _               = this.util._;
	var firstMerge      = false;

	var aggregateReport = new profile(this);

	this.profileGroup = function profileGroup(profilerCallback, isQuality) {

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

						var groupsSize = _.size(groupList.result.packages);
						isQuality ? aggregateReport.prettyPrintQualityReport(["security"], groupsSize) : aggregateReport.prettyPrintAggregationReport(groupsSize);

						!error ? profilerCallback(false, false, {type: "info", message: "profilingCompleted"}) : profilerCallback(false, false, {type: "error", message: "profilingFailed"});
					}, isQuality);
			  else profilerCallback(false, false, {type: "info", message: "menuReturn"});
			});
		}
	}

	this.generateGroupProfiles = function generateGroupProfiles(groupList, saveProfile, cachedProfiles, startCallback, isQuality) {

		var folderName      = this.datasetsFolder;
		var pace            = require('awesome-progress')({total: groupList.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var profilingErrors = [];

		// Parse through the dataset list items and fetch the corresponding JSON file
		groupProfiler.async.eachSeries(groupList, function(item, asyncCallback){

			var fileName = folderName + "/" +  item.name;
			var url      = groupProfiler.url + groupProfiler.API_path + groupProfiler.API_endpoints.dataset_description + item.name;
			var profilesFolder = isQuality ? groupProfiler.qualityFolder : groupProfiler.profilesFolder;

			// The user does not want to overwrite existing files, so we need to check if the file already exists and skip it
			if (!cachedProfiles) {
				groupProfiler.cache.getCache( profilesFolder + item.name, function(error, file){
					if (!error) {
						if (isQuality) {
							console.log(firstMerge);
											if (!firstMerge) {
												console.log("============ firstMerge================");
												aggregateReport.setQualityReport(file);
												firstMerge = true;
													//console.log(aggregateReport.getQualityProfile());
											} else aggregateReport.mergeQualityReports(file);
						} else {
							// cache file has been found successfully, do the needed statistics and aggregations and go to next dataset
							aggregateReport.aggregateCounter([file.counter]);
							aggregateReport.mergeReports(aggregateReport.getAggregateReport(), _.omit(file,"counter"));
						}
						next();
					} else retreiveProfiles(fileName, url);
				});
			} else retreiveProfiles(fileName, url);

			function retreiveProfiles(fileName, url) {

				var report          = new profile(this);

				groupProfiler.util.download(groupProfiler.cache, fileName, url, function(error, dataset){
					// If the file has been fetched successfully log it into the error.json
					if (error) next({ errors: 1 });
						else {

							groupProfiler.async.waterfall([retreiveProfiles, checkSave], function() { next() });

							function retreiveProfiles(callback){

								// Check if the report we need to generate is quality report or not
								if (isQuality) {
									groupProfiler.qualityProfiler.start(dataset , function (err, qualityReport) {
											// merge the profiling reports and prompt the user if he wants to save that report

																						// merge the profiling reports and prompt the user if he wants to save that report
											if (!firstMerge) {
												console.log("============ firstMerge================");
												aggregateReport.setQualityReport(qualityReport.getQualityProfile());
												firstMerge = true;
													//console.log(aggregateReport.getQualityProfile());
											} else aggregateReport.mergeQualityReports(qualityReport.getQualityProfile());
											callback(null, false, false, qualityReport.getQualityProfile());
									});
								} else {

									groupProfiler.async.parallel({

										generalProfiler   : groupProfiler.metadataProfiler.generalProfiler.start.bind(null,dataset),
										ownershipProfiler : groupProfiler.metadataProfiler.ownershipProfiler.start.bind(null,dataset),
										provenanceProfiler: groupProfiler.metadataProfiler.provenanceProfiler.start.bind(null,dataset),
										accessProfiler    : groupProfiler.metadataProfiler.accessProfiler.start.bind(null, dataset, true)

									}, function (err, result) {

											// merge the profiling reports and prompt the user if he wants to save that report
											report.mergeReportsUniquely([result.generalProfiler.getProfile(), result.ownershipProfiler, result.provenanceProfiler, result.accessProfiler.profile.getProfile()]);
											// merge the counter information retreived
											report.aggregateCounter([result.generalProfiler.getCounter(), result.accessProfiler.profile.getCounter()]);
											// print the generated merged report
											report.addObject("counter", report.getCounter());

											// add results to the aggregation report
											aggregateReport.mergeReports(aggregateReport.getAggregateReport(), report.getProfile());
											aggregateReport.aggregateCounter([report.getCounter()]);

											callback(null, result.accessProfiler.isChanged, result.accessProfiler.enhancedProfile, report.getProfile());
									});
								}
							}

							function checkSave(profileChanged, enhancedProfile, report, callback) {

								var profilesFolder = isQuality ? groupProfiler.qualityFolder : groupProfiler.profilesFolder;
								var enrichedFolder = groupProfiler.enrichedFolder;
								// The only option we did not catch if both are false, then do nothing and just move forward
								if (!saveProfile) callback();

								if (saveProfile && profileChanged) {

									groupProfiler.async.series([
										groupProfiler.cache.setCache.bind(null, profilesFolder + item.name, report),
										groupProfiler.cache.setCache.bind(null, enrichedFolder + item.name, enhancedProfile),
									], function(err) { callback() });

							} else if (saveProfile)
								groupProfiler.cache.setCache(profilesFolder + item.name, report, function(error){ callback() });
							}
						}
				});
			}
			// Signal the next iteration of the async call and update accordingly the progress bar with sucess or error
			function next(options) {
				options ? pace.op(options) : pace.op();
				asyncCallback();
			}
		},function(err){
			isQuality ? startCallback(false, aggregateReport): !_.isEmpty(aggregateReport) ? startCallback(false, aggregateReport) : startCallback(true,aggregateReport);
		});
	}
}

module.exports = groupProfiler;

