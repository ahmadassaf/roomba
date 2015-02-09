var profile = require('./profilers/profile');

var extend = require('extend');

function datasetProfiler(parent) {

	extend(this, parent);

	var datasetProfiler = this;
	var report          = new profile(this);

	this.profile = function profile(dataset, save, profilerCallback) {

		datasetProfiler.async.parallel({

			generalProfiler   : datasetProfiler.metadataProfiler.generalProfiler.start.bind(null,dataset),
			ownershipProfiler : datasetProfiler.metadataProfiler.ownershipProfiler.start.bind(null,dataset),
			provenanceProfiler: datasetProfiler.metadataProfiler.provenanceProfiler.start.bind(null,dataset),
			accessProfiler    : datasetProfiler.metadataProfiler.accessProfiler.start.bind(null, dataset, false)

		}, function (err, result) {

				// merge the profiling reports and prompt the user if he wants to save that report
				report.mergeReportsUniquely([result.generalProfiler.getProfile(), result.ownershipProfiler, result.provenanceProfiler, result.accessProfiler.profile.getProfile()]);
				// merge the counter information retreived
				report.aggregateCounter([result.generalProfiler.getCounter(), result.accessProfiler.profile.getCounter()]);
				// print the generated merged report
				report.prettyPrint();
				// add the counter to the profile to be saved
				report.addObject("counter", report.getCounter());
				// Check if the save prompt is valid to be displayed for saving report and enhanced profile
				displaySavePrompt(result);
		});

		function displaySavePrompt(result) {
			if (result.accessProfiler.isChanged) {
				datasetProfiler.CKANUtil.savePrompt("Enriched Metadata Profile", "enrichedFolder", result.accessProfiler.enhancedProfile, function(error){
					if (!error)
						datasetProfiler.CKANUtil.promptSave(save, "profilesFolder", report.getProfile(), profilerCallback);
				});
			} else datasetProfiler.CKANUtil.promptSave(save, "profilesFolder", report.getProfile(), profilerCallback);
		}
	}

	this.profileQuality = function profileQuality(dataset, profilerCallback) {

		qualityProfiler   : datasetProfiler.qualityProfiler.start(dataset , function (err, qualityReport) {
				// merge the profiling reports and prompt the user if he wants to save that report
				qualityReport.prettyPrintQualityReport(["security"]);
				// Check if the save prompt is valid to be displayed for saving report and enhanced profile
				datasetProfiler.CKANUtil.promptSave("true", "reportsFolder", qualityReport.getQualityProfile(), profilerCallback);
		});

	}

	this.profileDataset = function profileDataset(profilerCallback, isQuality) {
		// Create a prompt to ask for manual user entry of the dataset name
		this.CKANUtil.getDataset("getDataset", "Please enter the dataset name you wish to profile(type 'exit' to return back to previous menu):", function(error, dataset){
			if (!error) {
				if (isQuality) {
					// Call the dataset Quality profiler and get the report out of each
					datasetProfiler.profileQuality(dataset, function(error){
						if (!error) profilerCallback(false, false, {type: "info", message: "profilingCompleted"});
					});
				} else {
					// Call the different profiles and get the report out of each
					datasetProfiler.profile(dataset, true, function(error){
						if (!error) profilerCallback(false, false, {type: "info", message: "profilingCompleted"});
					});
				}

			} else profilerCallback(true, false, {type: "info", message: "menuReturn"});
		});
	}
}

module.exports = datasetProfiler;

