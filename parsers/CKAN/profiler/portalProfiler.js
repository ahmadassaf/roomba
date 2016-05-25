var profile = require('./profilers/profile');

var extend  = require('extend');

function portalProfiler(parent) {

	extend(this, parent);

	var portalProfiler  = this;
	var _               = this.util._;

	var aggregateReport = new profile(this);

	this.profilePortal  = function profilePortal(profilerCallback, isQuality) {

		portalProfiler.util.confirm("saveProfiles", portalProfiler.util.options.prompt.saveProfiles, function(saveProfile){
			if (saveProfile) {
				portalProfiler.util.confirm("cachedProfiles", portalProfiler.util.options.prompt.cachedProfiles, function(cachedProfiles){
					start(saveProfile, cachedProfiles);
				});
			} else start(saveProfile);
		});

		function start(saveProfile, cachedProfiles) {
			portalProfiler.crawler.getAllDatasetsDetails(function(error, data, message, datasetlist){
				if (!error)
					portalProfiler.generatePortalProfiles(datasetlist.result, saveProfile, cachedProfiles, function(error, aggregateReport){

						var portalSize = _.size(datasetlist.result);
						isQuality ? aggregateReport.prettyPrintQualityReport(["security"], portalSize) : aggregateReport.prettyPrintAggregationReport(portalSize);

						!error ? profilerCallback(false, false, {type: "info", message: "profilingCompleted"}) : profilerCallback(false, false, {type: "error", message: "profilingFailed"});
					}, isQuality);
			  else profilerCallback(false, false, {type: "info", message: "menuReturn"});
			});
		}
	}

	this.generatePortalProfiles = function generateGroupProfiles(datasetlist, saveProfile, cachedProfiles, startCallback, isQuality) {

		var folderName      = this.datasetsFolder;
		var pace            = require('awesome-progress')({total: datasetlist.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var profilingErrors = [];

		// Parse through the dataset list items and fetch the corresponding JSON file
		portalProfiler.async.eachSeries(datasetlist, function(item, asyncCallback){

			var fileName       = folderName + "/" +  item;
			var url            = portalProfiler.url + portalProfiler.API_path + portalProfiler.API_endpoints.dataset_description + item;
			var profilesFolder = isQuality ? portalProfiler.qualityFolder : portalProfiler.profilesFolder;

			// The user does not want to overwrite existing files, so we need to check if the file already exists and skip it
			if (!cachedProfiles) {
				portalProfiler.cache.getCache(profilesFolder + item, function(error, file){
					if (!error) {
							if (isQuality) {
								aggregateReport.mergeQualityReports(file);
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

				portalProfiler.util.download(portalProfiler.cache, fileName, url, function(error, dataset){
					// If the file has been fetched successfully log it into the error.json
					if (error) next({errors: 1});
						else {

							portalProfiler.async.waterfall([retreiveProfiles, checkSave], function() { next() });

							function retreiveProfiles(callback){

								// Check if the report we need to generate is quality report or not
								if (isQuality) {
									portalProfiler.qualityProfiler.start(dataset , function (err, qualityReport) {
											// merge the profiling reports and prompt the user if he wants to save that report
											aggregateReport.mergeQualityReports(qualityReport.getQualityProfile());
											callback(null, false, false, qualityReport.getQualityProfile());
									});
								} else {

									portalProfiler.async.parallel({

										generalProfiler   : portalProfiler.metadataProfiler.generalProfiler.start.bind(null,dataset),
										ownershipProfiler : portalProfiler.metadataProfiler.ownershipProfiler.start.bind(null,dataset),
										provenanceProfiler: portalProfiler.metadataProfiler.provenanceProfiler.start.bind(null,dataset),
										accessProfiler    : portalProfiler.metadataProfiler.accessProfiler.start.bind(null, dataset, true)

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

								var profilesFolder = isQuality ? portalProfiler.qualityFolder : portalProfiler.profilesFolder;
								var enrichedFolder = portalProfiler.enrichedFolder;

								// The only option we did not catch if both are false, then do nothing and just move forward
								if (!saveProfile) callback();

								if (saveProfile && profileChanged) {

									portalProfiler.async.series([
										portalProfiler.cache.setCache.bind(null, profilesFolder + item, report),
										portalProfiler.cache.setCache.bind(null, enrichedFolder + item, enhancedProfile),
									], function(err) { callback() });

							} else if (saveProfile)
								portalProfiler.cache.setCache(profilesFolder + item, report, function(error){ callback() });
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

module.exports = portalProfiler;

