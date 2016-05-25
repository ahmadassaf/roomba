var extend = require('extend');

function datasetParser(parent) {
	extend(this, parent);

	var datasetParser = this;

	this.parseDatasetList = function parseDatasetList(datasetsList, callback) {

		var folderName    = this.datasetsFolder;
		var pace          = require('awesome-progress')({total: datasetsList.result.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var errors        = [];

		// Parse through the dataset list items and fetch the corresponding JSON file
		this.async.eachLimit(datasetsList.result,0.0001,function(item, asyncCallback){

			var fileName = folderName + "/" +  item;
			var url      = datasetParser.url + datasetParser.API_path + datasetParser.API_endpoints.dataset_description + item;

			datasetParser.util.download(datasetParser.cache, fileName, url, function(error, dataset){
				// If the file has been fetched successfully log it into the error.json
				if (error) {
					errors.push(item);
					pace.op({errors: 1});
				} else pace.op();
				asyncCallback();
			});
		},function(err){
			// The dataset lists has been successfully parsed, check if there has been any errors and save them to errors.json
			if (errors.length > 0) {
				datasetParser.cache.setCache(datasetParser.portalName + "/errors", errors, function(error, success) {
				if (!error) callback(false, false, {type: "info", message :"menuReturn"});
				});
			} else callback(false, false, {type: "info", message :"menuReturn"});
		});
	}
};

module.exports = datasetParser;