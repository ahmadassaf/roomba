var profile = require('./profilers/profile');

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
						aggregateReport.prettyPrintAggregationReport(_.size(groupList.result.packages));
						!error ? profilerCallback(false, false, {type: "info", message: "profilingCompleted"}) : profilerCallback(false, false, {type: "error", message: "profilingFailed"});
					});
			  else profilerCallback(false, false, {type: "info", message: "menuReturn"});
			});
		}
	}

	this.generateGroupProfiles = function generateGroupProfiles(groupList, saveProfile, cachedProfiles, startCallback) {

		var folderName      = this.datasetsFolder;
		var pace            = require('awesome-progress')({total: groupList.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var profilingErrors = [];

		// Parse through the dataset list items and fetch the corresponding JSON file
		groupProfiler.async.eachSeries(groupList, function(item, asyncCallback){

			var fileName = folderName + "/" +  item.name;
			var url      = groupProfiler.url + groupProfiler.API_path + groupProfiler.API_endpoints.dataset_description + item.name;

			// The user does not want to overwrite existing files, so we need to check if the file already exists and skip it
			if (!cachedProfiles) {
				groupProfiler.cache.getCache(groupProfiler.profilesFolder + item.name, function(error, file){
					if (!error) {
						// cache file has been found successfully, do the needed statistics and aggregations and go to next dataset
						aggregateReport.aggregateCounter([file.counter]);
						aggregateReport.mergeReports(aggregateReport.getAggregateReport(), _.omit(file,"counter"));
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

							function checkSave(profileChanged, enhancedProfile, report, callback) {
								// The only option we did not catch if both are false, then do nothing and just move forward
								if (!saveProfile) callback();

								if (saveProfile && profileChanged) {

									groupProfiler.async.series([
										groupProfiler.cache.setCache.bind(null, groupProfiler.profilesFolder + item.name, report),
										groupProfiler.cache.setCache.bind(null, groupProfiler.enrichedFolder + item.name, enhancedProfile),
									], function(err) { callback() });

							} else if (saveProfile)
								groupProfiler.cache.setCache(groupProfiler.profilesFolder + item.name, report, function(error){ callback() });
							}
						}
				});
			}
			// Signal the next iteration of the async call and update accordingly the progress bar with sucess or error
			function next(options) {
				options ? pace.op(options) : pace.op();
				asyncCallback();
			}
		},function(err){ !_.isEmpty(aggregateReport) ? startCallback(false, aggregateReport) : startCallback(true,aggregateReport) });
	}

}

module.exports = groupProfiler;

