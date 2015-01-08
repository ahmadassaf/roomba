var datasetCrawler = require('./datasetCrawler');
var groupCrawler   = require('./groupCrawler');

var extend         = require('extend');

function crawler(parent) {

	extend(this, parent);

	this.datasetCrawler = new datasetCrawler(this);
	this.groupCrawler   = new groupCrawler(this);

	this.cache.createCacheFolder(this.datasetsFolder, null, false);
	this.cache.createCacheFolder(this.groupsFolder, null, false);
};

/* All function implementations have to know the callback error and success values
 * callback function: callback(error, success, message)
 * @error: true when an error happen and the function wishes that the user is sent back to address entry prompt
 * 				 false when the function has been executed successfully
 * @message: Appropriate message that will be printed
*/

/**
* Get the JSON file containing the list members of a dataset or a group
*
* @method getList
* @param {String} listName: The name of the list to be retrieved
* @param {String} fileName: The name of the file to save the list in
* @param {Function} callback: Returns the list after the data has been successfully saved in the file system
*                             Returns a true error if the list wasn't fetched successfully
*/
crawler.prototype.getList =  function getList(listName, fileName, callback) {

	// build the URL for the list (group, dataset) that we wish to fetch
	var url      = this.url + this.API_path + listName;
	this.util.downloadWithProgress(this.cache, fileName, url, function(error, datasetList){
		!error && datasetList.success ? callback(false, datasetList) : callback(true);
	});
}

/**
* Fetch all the datasets JSON file metadata in the portal
* This required that the datasets list is fetched successfully via a call to getList()
*
* @method getAllDatasetsDetails
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
crawler.prototype.getAllDatasetsDetails = function getAllDatasetsDetails(parserInterfaceCallback) {
	this.datasetCrawler.getAllDatasetsDetails(parserInterfaceCallback);
}

/**
* Get the JSON file containing the metadata of a specific dataset
* This function will create a prompt to ask the user for a manual entry of the dataset name
*
* @method getDatasetDetails
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
crawler.prototype.getDatasetDetails = function getDatasetDetails(parserInterfaceCallback) {
	this.datasetCrawler.getDatasetDetails(parserInterfaceCallback);
}

/**
* Fetch the JSON files for all the datasets in a specific group provided the group name
* The group's metadata file is fetched in the parent folder and the datasets are fetched in the datasets subfolder
*
* @method getGroupDetails
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
crawler.prototype.getGroupDetails = function getGroupDetails(parserInterfaceCallback) {
	this.groupCrawler.getGroupDetails(parserInterfaceCallback,null,true);
}

/**
* Fetch all the groups JSON file metadata in the portal
* This required that the groups list is fetched successfully via a call to getList()
*
* @method getAllGroupsDetails
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
crawler.prototype.getAllGroupsDetails =  function getAllGroupsDetails(parserInterfaceCallback) {
	this.groupCrawler.getAllGroupsDetails(parserInterfaceCallback);
}

module.exports = crawler;