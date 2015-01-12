var profile = require('./profile');

var extend = require('extend');

function datasetProfiler(parent) {

	extend(this, parent);

	var datasetProfiler = this;
	var report          = new profile(this);

	this.profile = function profile(dataset, save, profilerCallback) {

		datasetProfiler.metadataProfiler.generalProfiler.start(dataset, function(error, generalReport){
			if (!error) datasetProfiler.metadataProfiler.ownershipProfiler.start(dataset, function(error, ownershipReport){
				if (!error) datasetProfiler.metadataProfiler.provenanceProfiler.start(dataset, function(error, provenanceReport){
					if (!error) datasetProfiler.metadataProfiler.accessProfiler.start(dataset, function(error, accessReport, profileChanged, enhancedProfile){
						if (!error) {

							// merge the profiling reports and prompt the user if he wants to save that report
							report.mergeReportsUniquely([generalReport, ownershipReport, provenanceReport, accessReport]);
							report.prettyPrint();

							if (profileChanged) {
								datasetProfiler.CKANUtil.savePrompt("Enriched Metadata Profile", "enrichedFolder", enhancedProfile, function(error){
									if (!error)
										datasetProfiler.CKANUtil.promptSave(save, "profilesFolder", report, profilerCallback);
								});
							} else datasetProfiler.CKANUtil.promptSave(save, "profilesFolder", report, profilerCallback);
						}
					});
				});
			});
		});
	}

	this.profileDataset = function profileDataset(profilerCallback) {
		// Create a prompt to ask for manual user entry of the dataset name
		this.CKANUtil.getDataset("getDataset", "Please enter the dataset name you wish to profile(type 'exit' to return back to previous menu):", function(error, dataset){
			if (!error) {
				// Call the different profiles and get the report out of each
				datasetProfiler.profile(dataset, true, function(error){
					if (!error) {
						profilerCallback(false, false, {type: "info", message: "profilingCompleted"});
					}
				});
			} else profilerCallback(true, false, {type: "info", message: "menuReturn"});
		});
	}
}

module.exports = datasetProfiler;

