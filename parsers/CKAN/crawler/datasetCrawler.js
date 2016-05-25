var extend = require('extend');

function datasetCrawler(parent) {

	extend(this, parent);

	var datasetCrawler = this;

	this.getDatasetDetails = function(parserCallback) {

		this.CKANUtil.getDataset("getDataset", this.options.prompt.datasetNameEntry, function(error, dataset ){
			if (!error) {
					parserCallback(false, null, {type:"info", message : "datasetFetched"});
			} else parserCallback(true, false, {type: "info", message: "menuReturn"});
		});
	}

	this.getAllDatasetsDetails = function(parserCallback) {

		var listName       = this.API_endpoints.datasets_list;
		var fileName       = this.portalName + '/' + listName;

		// get the datasets list that exists in the portal, getList is a function in Crawler, the parent file
		this.getList(listName, fileName, function(error, result){
			if (!error) {
				if (!result.result.results) {
					// The call has been successful and we should parse the datasets list
					datasetCrawler.parser.parseDatasetList(result, function(error, success, message) {
						parserCallback(error, success, message,result);
					});
				} else {
					// The file doesn't contain valid values, remove it and return a true error
					datasetCrawler.cache.removeFile(fileName);
					parserCallback(true, false, {type : "error", message: "invalidAPIResult"});
				}
			} else parserCallback(true, false, {type: "error", message: "CKANAPIError"});
		});
	}
};

module.exports = datasetCrawler;