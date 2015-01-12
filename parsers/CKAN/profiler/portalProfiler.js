var extend = require('extend');

function portalProfiler(parent) {

	extend(this, parent);

	var portalProfiler = this;
	var _              = this.util._;

	this.profilePortal = function profilePortal(profilerCallback) {

		// prompt the user if he wishes to save the profiles generated
		portalProfiler.util.confirm("saveProfiles", portalProfiler.util.messages.prompt.saveProfiles, function(confirmation){
			portalProfiler.util.confirm("cachedProfiles", portalProfiler.util.messages.prompt.cachedProfiles, function(cachedProfiles){
				portalProfiler.crawler.getAllDatasetsDetails(function(error, data, message, datasetlist){
					if (!error)
						portalProfiler.generatePortalProfiles(datasetlist.result, confirmation, cachedProfiles, function(error, aggregateReport){
							console.log(aggregateReport);
							/* To Do : The saving process and prompt */
							!error ? profilerCallback(false, false, {type: "info", message: "profilingCompleted"}) : profilerCallback(false, false, {type: "error", message: "profilingFailed"});
						});
				  else profilerCallback(false, false, {type: "info", message: "menuReturn"});
				});
			});
		});
	}

	this.generatePortalProfiles = function generatePortalProfiles(datasetlist, confirmation, cachedProfiles, callback) {

		var folderName      = this.datasetsFolder;
		var pace            = require('awesome-progress')({total: datasetlist.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var aggregateReport = {};

		// Parse through the dataset list items and fetch the corresponding JSON file
		portalProfiler.async.eachLimit(datasetlist,0.0001,function(item, asyncCallback){

			var fileName = folderName + "/" +  item;
			var url      = portalProfiler.url + portalProfiler.API_path + portalProfiler.API_endpoints.dataset_description + item;

			portalProfiler.util.download(portalProfiler.cache, fileName, url, function(error, dataset){
				// If the file has been fetched successfully log it into the error.json
				if (error) tick({errors: 1});
				else {
					portalProfiler.metadataProfiler.generalProfiler.start(dataset, function(error, generalProfile){
						if (!error) portalProfiler.metadataProfiler.ownershipProfiler.start(dataset, function(error, ownershipProfile){
							if (!error) portalProfiler.metadataProfiler.provenanceProfiler.start(dataset, function(error, provenanceProfile){
								//if (!error) portalProfiler.metadataProfiler.accessProfiler.start(dataset, function(error, profileChangedFromAccess, accessProfile){
									if (!error) {
										aggregateReport[item] = portalProfiler.util.mergeObjects({}, [generalProfile, ownershipProfile, provenanceProfile]);
										tick();
									} else tick();
								//});
							});
						});
					});
				}
			});
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

module.exports = portalProfiler;

