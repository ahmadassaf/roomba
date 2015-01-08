var extend = require('extend');

function CKANUtil(parent) {

	extend(this, parent);

}

CKANUtil.prototype.getDataset = function getDataset(promptName, promptMessage, callback) {

	var CKANUtil = this;

	// Create a prompt to ask for manual user entry of the dataset name
	this.util.getInput(promptName, promptMessage, function(name){

		// Build the file name we wish to cache the file in and the URL of the resource we want to fetch/ check if exists
		var filename = CKANUtil.datasetsFolder + name;
		var url      = CKANUtil.url + CKANUtil.API_path + CKANUtil.API_endpoints.dataset_description + name;

		// Check if the user has entered an "exit" signal
		if (name !== "exit") {
			CKANUtil.util.downloadWithProgress(CKANUtil.cache, filename, url, function(error, dataset){
				if (!error && dataset.success)
					callback(false,dataset);
				else {
					CKANUtil.util.console("warning","invalidResourceName");
					CKANUtil.getDataset(promptName, promptMessage, callback);
				}
			});
			// return back with a true error that is not fatal with a mainMenuReturn message
		} else callback(true,{type: "info", message: "menuReturn"});
	});
}

CKANUtil.prototype.getGroup = function getGroup(promptName, promptMessage, callback, groupName, showDownloadIndicator) {

	var CKANUtil = this;

	/* Check if the group name has been specified, if not then we should ask for the user's manual entry
	 * The group name can be dynamically sent via the getAllGroupsDetails fuction
	 */
	if (!groupName) {
		this.util.getInput(promptName, promptMessage, function(name){
			// Check for exit signal in the manual user input to return back to the main menu
			name !== "exit" ? getGroupByName(name, false, showDownloadIndicator) : callback(true);
		});
	// There is no manually passed groupName, the call is done via getAllGroupsDetails, hide the pace progress bar
	} else getGroupByName(groupName, true, showDownloadIndicator);

	/* The main function that will fetch the group's JSON meta file
	 * The progress bar is hidden when the group's metafile is fetched within the context of getAllGroupsDetails
	 * The progress bar value if not passed as true is shown by default
	 */

	function getGroupByName(groupName, hidePace, hideDownloadIndicator) {

		var foldername = CKANUtil.groupsFolder + groupName;
		var filename   = foldername + "/groupMeta";
		var url        = CKANUtil.url + CKANUtil.API_path + CKANUtil.API_endpoints.group_description + groupName;

		// Create the main cache folder for that group with the group name
		CKANUtil.cache.createCacheFolder(foldername, function(error){
			if (!error) {
				showDownloadIndicator ? CKANUtil.util.downloadWithProgress(CKANUtil.cache, filename, url, processDownload) : CKANUtil.util.download(CKANUtil.cache, filename, url, processDownload);
			}
		});

		function processDownload(error, group){
			if (!error && group.success) {
				var datasetsFoldername = foldername + '/datasets/';
				// create the sub folder datasets in the group cache that will contain the datasets fetched
				CKANUtil.cache.createCacheFolder(datasetsFoldername, function(error){
					if (!error) callback(false, group, datasetsFoldername, hidePace, groupName);
				});
			/* The group information is wrong or the group name doesn't exist in this portal, show error message, remove the folder created and prompt again
			 * The prompt happens because the error in group name only happens in manual entry mode
			 */
			} else {
				CKANUtil.util.console("warning","invalidResourceName");
				CKANUtil.cache.removeFolder(foldername);
				CKANUtil.getGroup(promptName, promptMessage, callback);
			}
		};
	}
}

CKANUtil.prototype.savePrompt = function savePrompt(id, folder, file, callback) {

	var CKANUtil = this;

	CKANUtil.util.confirm("save" + id, "Would you like to save this " + id , function(confirmation){
		if (confirmation) {
			// get the users manual input for the file name he wishes to save
			CKANUtil.util.getInput("fileName", "Please enter " + id + "  name", function(name){
				CKANUtil.cache.setCache(CKANUtil[folder] + name, file, function(error){
					if (!error) callback(false, file)
				})
			});
		} else callback(false, file);
	});
}

CKANUtil.prototype.promptSave = function promptSave(save, folder, report, callback) {
	save ?  this.savePrompt("Report", folder, report, callback) : callback(false, report);
}

module.exports = CKANUtil;

