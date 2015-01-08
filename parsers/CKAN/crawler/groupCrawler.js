var extend = require('extend');

function groupCrawler(parent) {

	extend(this, parent);

	var groupCrawler = this;

	this.getGroupDetails = function getGroupDetails(parserCallback, groupName, showDownloadIndicator) {

		this.CKANUtil.getGroup("getGroup", this.options.prompt.groupNameEntry,
			function(error, group, datasetsFoldername, hidePace, groupName) {
			if (error) parserCallback(true, false, {type: "info", message: "menuReturn"});
				else {
					groupCrawler.parser.parseGroupMembers(group, datasetsFoldername , function(error, success){
						error ? parserCallback(true, false, {type: "info", message: "invalidAPIResult"}) : parserCallback(false, null, {type:"info", message : "groupFetched"}, group); }
					, hidePace);
				}
		}, groupName, showDownloadIndicator);
	}

	this.getAllGroupsDetails = function getAllGroupsDetails(parserCallback) {

		var listName = this.API_endpoints.groups_list;
		var fileName = this.portalName + '/' + listName;

		this.getList(listName, fileName, function(error, result){
			if (!error) {
				if (result.result.length !== 0)
					// The call has been successful and we should parse the groups list
					groupCrawler.parser.parseGroupsList(result, groupCrawler, function(error, success, message) {
							parserCallback(error, success, message);
			 		});
				else {
					groupCrawler.cache.removeFile(fileName);
					parserCallback(true, false, {type: "warning", message : "noGroupsFound"})
				}
			} else parserCallback(true, false, {type: "error", message: "CKANAPIError"});
		});
	}
};

module.exports = groupCrawler;