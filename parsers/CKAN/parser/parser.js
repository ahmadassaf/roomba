var datasetParser = require('./datasetParser');
var groupParser   = require('./groupParser');

var extend = require('extend');

function parser(parent) {
	extend(this, parent);

	this.datasetParser = new datasetParser(this);
	this.groupParser   = new groupParser(this);
};

/**
* Parse a dataset list by fetching all the datasets JSON in that list
*
* @method parseDatasetList
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
parser.prototype.parseDatasetList = function parseDatasetList(datasetsList, crawlerCallback) {
	this.datasetParser.parseDatasetList(datasetsList, crawlerCallback);
}

/**
* Go through a group list and fetch all the datasets JSON metadata in that group
*
* @method parseGroupMembers
* @param {Object} group: the JSON metadata of a group
* @param {String} groupFolder: the system path for the group root cache folder
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
* @param {Boolean} hidePace: indicate whether to hide the progress bar when fetching data
*/
parser.prototype.parseGroupMembers = function parseGroupMembers(group, groupFolder, crawlerCallback, hidePace) {
	this.groupParser.parseGroupMembers(group, groupFolder, crawlerCallback, hidePace);
}

/**
* Fetch all the datasets JSON files for all the groups in a data portal
*
* @method parseGroupsList
* @param {Object} groupsList: the groups JSON file containing the list of the groups
* @param {Object} crawler: a reference to the crawler object
* @param {Function} callback: When successfull returns a false error with a success message -> callback(false, false, SuccessMessage)
*                             When failed returns a true error with a fail message -> callback(true, false, ErrorMessage)
*/
parser.prototype.parseGroupsList = function parseGroupsList(groupsList, crawler, crawlerCallback) {
	this.groupParser.parseGroupsList(groupsList, crawler, crawlerCallback);
}

module.exports = parser;