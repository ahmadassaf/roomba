var extend = require('extend');

function reportGenerator(parent) {

	extend(this, parent);

	var reportGenerator = this;
	var _               = this.util._;


	this.generateGroupReport = function generateGroupReport(reporterCallback) {
		reportGenerator.crawler.getGroupDetails(function(error, data, message, groupList){
			if (!error)
			reportGenerator.util.promptActionList("list", "generateGroupReport",reportGenerator.options.prompt.reportSelection, reportGenerator.options.prompt.reportGenerationChoiceList, function(answer) {
					// Call the report generation function with the correct parameters
					answer !== "exit" ? reportGenerator.generate(groupList.result.packages, answer, reporterCallback) : reporterCallback(false, false, {type: "info", message: "menuReturn"});
				});
		  else reporterCallback(false, false, {type: "info", message: "menuReturn"});
		});
	}

	this.generatePortalReport = function generatePortalReport(reporterCallback) {
		reportGenerator.crawler.getAllDatasetsDetails(function(error, data, message, datasetlist){
			if (!error)
			reportGenerator.util.promptActionList("list", "generateGroupReport", reportGenerator.options.prompt.reportSelection, reportGenerator.options.prompt.reportGenerationChoiceList, function(answer) {
				// Call the report generation function with the correct parameters
				answer !== "exit" ? reportGenerator.generate(datasetlist.result, answer, reporterCallback) : reporterCallback(false, false, {type: "info", message: "menuReturn"});
			}); else reporterCallback(false, false, {type: "info", message: "menuReturn"});
		});
	}

	this.generate = function generate(list, action, reporterCallback) {
		// The call has been successful and we should parse the datasets list
		reportGenerator.executeAction(list, action, function(error, report) {
			if (!error) {
				console.log(report);
				if (action == "objectValueAggregator")
					 _.each(report, function(section, key){ console.log(key + " with total count of: " + _.size(section)); });
				reportGenerator.util.confirm("saveProfile", "Would you like to save this report", function(confirmation){
					if (confirmation) {
						// get the users manual input for the file name he wishes to save
						reportGenerator.util.getInput("reportName", "Please enter the Report Name:", function(name){
							reportGenerator.cache.setCache(reportGenerator.reportsFolder + name, report, function(error){
								if (!error) reporterCallback(false, false, {type: "info", message: "reportGenerated"});
							})
						});
					} else reporterCallback(false, false, {type: "info", message: "reportGenerated"});
				});
			}
		});
	}

	this.executeAction = function executeAction(datasetsList, action, callback) {

		var executeAction = this;

		var folderName    = this.datasetsFolder;
		var pace          = require('awesome-progress')({total: datasetsList.length, finishMessage: this.options.info.datasetsFetched, errorMessage: this.options.error.parseError});
		var objectReport  = {}, arrayReport = [];

		getReportDetails();

		function getReportDetails() {
			action == "valueAggregator" || action == "checkEmpty" ? reportGenerator.util.getInput( "fieldName", "Please enter the Field Name you wish to get details for [Note: For nested fields use '>' e.g. resources>resource_type]", function(field){ execute(field) }) : reportGenerator.util.getInput( "fieldName", "Please enter the key/value details. Please separate them using ':' and use '>' for nested fields. e.g. resources>resource_type:resources>name", function(field){ execute(field)}, ":");
			}

		function execute(prompt) {

			// Parse through the dataset list items and fetch the corresponding JSON file
			executeAction.async.eachLimit(datasetsList,0.0001,function(item, asyncCallback){

				var item     = item.name ? item.name : item;
				var fileName = folderName + "/" +  item;
				var url      = reportGenerator.url + reportGenerator.API_path + reportGenerator.API_endpoints.dataset_description + item;

				reportGenerator.util.download(reportGenerator.cache, fileName, url, function(error, dataset){
					// If the file has been fetched successfully log it into the error.json
					if (error) pace.op({errors: 1});
					else {

						 /* Here we will be executing the several actions to generate desired reports
						 * Report 1: Licenss Report: Aggregate all the license information used in a portal
						 * Report 2: Check all the possible values of a certain field giving its path
						 * Report 3: Check all the possible type values of a certain field giving its path
						 */

						 switch(action) {
								case "valueAggregator" :
								reportGenerator.reportFactory.getFieldValues(dataset, prompt, function(error, report){
									if (!error) arrayReport = _.union(arrayReport, _.flatten(report));
								}); break;
								case "checkEmpty" :
								reportGenerator.reportFactory.checkEmpty(dataset, prompt, function(error, report){
									if (!error) arrayReport = _.union(arrayReport, _.flatten(report));
								}); break;
								case "objectValueAggregator" :
								// Call the objectValueAggregator that will aggregate the information
								reportGenerator.reportFactory.getObjectKeyValues(dataset, prompt, function(error, rawReport){
									_.each(rawReport, function(value, key){
										if (_.has(objectReport, key)) {
											objectReport[key].push(rawReport[key]);
											objectReport[key] = _.uniq(_.flatten(objectReport[key]));
										} else objectReport[key] = rawReport[key];
									});
								}); break;
							}
						// Signal the progress bar
						pace.op();
					}
					asyncCallback();
				});
			},function(err){
				// The dataset lists has been successfully parsed, check if there has been any errors and save them to errors.json
				!_.isEmpty(arrayReport) ? callback(false, arrayReport) : callback(false,objectReport);
			});
		}
	}
}
module.exports = reportGenerator;

