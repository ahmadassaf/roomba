var extend = require('extend');

function groupParser(parent) {
	extend(this, parent);

	var groupParser = this;

	this.parseGroupMembers = function parseGroupMembers(group, groupFolder, callback, hidePace) {

		var pace = !hidePace ? require('awesome-progress')({total: group.result.packages.length, finishMessage: this.options.info.groupsFetched}) : null;

		// Parse through the dataset list items and fetch the corresponding JSON file
		this.async.eachLimit(group.result.packages,0.0001,function(group, asyncCallback){

			var fileName = groupParser.datasetsFolder + "/" +  group.name;
			var url      = groupParser.url + groupParser.API_path + groupParser.API_endpoints.dataset_description + group.name;

			/* The file will be checked if it has been downloaded in the root datasets folder
			 * If yes, then it will be only fetched from there and added to the local datasets folder of the group
			 * if not, then it will be fetched into the main datasets folder as it acts as the main meta hub and
			 * then copied to the local group datasets folder
			 */
			groupParser.util.download(groupParser.cache, fileName, url, function(error, file){
				groupParser.cache.setCache(groupFolder + "/" + group.name, file, function(error, success) {
					if (!error) {
						if (pace) pace.op();
						asyncCallback();
					}
				});
			});

		},function(err){
			callback(false, false, {type: "info", message :"menuReturn"});
		});
	}

	this.parseGroupsList = function parseGroupsList(groupsList, crawler, callback) {

		var pace = require('awesome-progress')({total: groupsList.result.length, finishMessage: this.options.info.groupsFetched});

		this.async.eachLimit(groupsList.result,0.0001,function(group, asyncCallback){
			crawler.getGroupDetails(function(error, success){
				if (!error) {
					pace.op();
					asyncCallback();
				}
			}, group, false);
		},function(err){
				callback(false, false, {type: "info", message :"menuReturn"});
		});
	}
};

module.exports = groupParser;