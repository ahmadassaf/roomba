var qualityModel    = require('../../../../util/qualityModel.json')

var _               = require("underscore");
var extend          = require('extend');

function profile(parent) {

	extend(this, parent);

	var util      = this.util;

	// The default profile constructors
	this.template        = {"missing" : [], "undefined" : [], "unreachableURLs": [], "report" : []};
	this.aggregateReport = {"missing" : {}, "undefined" : {}, "unreachableURLs": {}, "report" : {}};
	this.counter         = {"group" : 0, "tag" : 0, "resource" : 0};
	this.qualityProfile  = qualityModel;


	/**************************** Setters and Getters ****************************/


	/**
	* Sets the current profile to a value passed by the user
	*
	* @method setProfile
	* @param {Object} profile: the profile we need to assign to the current profile
	*/
	this.setProfile = function setProfile(profile) {
		this.template = profile;
	}

	/**
	* Gets the current profile and return back
	*
	* @method getProfile
	* @return {Object} return the current profile
	*/
	this.getProfile = function getProfile() {
		return this.template;
	}

	/**
	* Gets the current counter and return back
	*
	* @method getCounter
	* @return {Object} return the current counter
	*/
	this.getCounter = function getCounter() {
		return this.counter;
	}


	/**
	* Gets the current counter and return back
	*
	* @method getQualityProfile
	* @return {Object} return the current quality profile
	*/
	this.getQualityProfile = function getQualityProfile() {
		return this.qualityProfile;
	}


	/**
	* Gets the current aggregate Report and return back
	*
	* @method getAggregateReport
	* @return {Object} return the current profile
	*/
	this.getAggregateReport = function getProfile() {
		return this.aggregateReport;
	}

	/**
	* Update the counter  of a specific key with a passed value
	*
	* @method augmentCounter
	* @param {String} key: the counter section we need to assign to update
	* @param {Integer} value: the numerical value we want to increase the counter by
	*/
	this.setCounter = function setProfile(key, value) {
		this.counter[key] = value;
	}

	/**
	* Set the quality model with the one passed as a parameter
	*
	* @method setQualityReport
	* @param {Object} qualityModel: the qualityModel we need to assign
	*/
	this.setQualityReport = function setQualityReport(qualityModel) {
		this.qualityProfile = qualityModel;
	}


	/**
	* Set a quality indicator score
	*
	* @method setQualityIndicatorScore
	* @param {String} qualityMeasure: the quality masure parent of the quality indicator
	* @param {String} qualityIndicator: the quality indicator we need to assign a score to
	* @param {Integer} score: the quality indicator score
	*/
	this.setQualityIndicatorScore = function setQualityIndicatorScore(qualityMeasure, qualityIndicator, score) {
		if (_.isArray(qualityIndicator)) {
			_.each(qualityIndicator, function(indicator){
				this.qualityProfile[qualityMeasure][indicator].score = score * this.qualityProfile[qualityMeasure][indicator].weight;
			});
		} else this.qualityProfile[qualityMeasure][qualityIndicator].score = score * this.qualityProfile[qualityMeasure][qualityIndicator].weight;
	}

	/**
	* Inserts an entry to a part of the profile i.e insert an entry for a missing field
	* The entry should fit in one of the defined keys defined in the report
	*
	* @method addEntry
	* @param {String} key: the key of the profile we will be inserting into
	* @param {Object} profile: the value to be inserted in the profile
	* @param {String} profile: the explaination of the entry added to the report
	*/
	this.addEntry = function addEntry(key, entry, entryMessage) {
		this.template[key].push(entry);
		if (entryMessage) this.template.report.push(entryMessage);
	}

	/**
	* Inserts an object to add to the report, for example a new key entry that will contain report fields
	* this is case when we want to add special report for groups, resources, etc.
	*
	* @method addObject
	* @param {String} key: the key of the profile we will be inserting into
	* @param {Object} object: the value to be inserted in the profile
	* @param {String} position: the key of the profile where we wish to add the object
	*/
	this.addObject = function addObject(key, object, position) {
		if (position) {
			if (_.has(this.template, position))
				_.isArray(this.template[position]) ? this.template[position].push(object): this.template[position][key] = object;
		} else this.template[key] = object;
	}

	/**
	* Inserts entries to the profile i.e insert an entry for a missing field
	* by parsing an array of keys against the dataset
	*
	* @method parseKeys
	* @param {Array} metadtaKeys: the keys array we want to check against
	* @param {Object} dataset: the dataset we want to examine
	* @param {String} profile: the explaination of the entry added to the report
	*/
	this.insertKeys = function addEntry(metadtaKeys, dataset, includeQuality) {

		var profile        = this;
		var qualityCounter = 0;

		_.each(metadtaKeys, function(key, index) {
			if (_.has(dataset, key)) {
				if (_.isUndefined(dataset[key]) || _.isNull(dataset[key]) || ( _.isString(dataset[key]) && dataset[key].length == 0)) {
					profile.addEntry("undefined", key, key + " field exists but there is no value defined");
					qualityCounter++;
				}
			} else {
				profile.addEntry("missing", key, key + " field is missing");
				qualityCounter++;
			}
		});
		if (includeQuality) return qualityCounter;
	}

	/**
	* Inserts entries to the profile i.e insert an entry for a missing field
	* by checking the connectivity of the passed URL
	*
	* @method checkReferencability
	* @param {Object} util: the util object [contains helper functions]
	* @param {String} url: the url we want to check against
	* @param {String} message: the message we want to add to the report
	* @param {Function} callback: return the check value
	*/
	this.checkReferencability = function checkReferencability(util, url, message, callback, isResource, resourceType) {

		var profile = this;

		util.checkAddress(url, function(error, body, response) {
			if (error) {
				profile.addEntry("report", message);
				profile.addEntry("unreachableURLs", url);
				if (isResource) {
					profile.addObject("unreachableTypes", {});
					profile.addObject(resourceType, url, "unreachableTypes");
				}
				callback(true);
			} else callback(false, response.headers);
		}, "HEAD");
	}

	/**************************** Mergers & Aggregators ****************************/

	/**
	* Update the counter  of a specific key with a passed array of counters
	*
	* @method augmentCounter
	* @param {Array} counters: the counters Array we need to assign to update
	*/
	this.aggregateCounter = function aggregateCounter(counters) {
		var profile = this;
		_.each(counters, function(counter) {
			_.each(counter, function(value, counterSection){
				profile.counter[counterSection] += value;
			});
		});
	}

	/**
	* Unqieuly merges all the properties of objects into a target
	*
	* @method mergeReportsUniquely
	* @param {Array} objects: An Array of objects on which will be copied into the target
	* @return {Object} output the desired object with all the targets and their properties uniquely merged
	*/
	this.mergeReportsUniquely = function mergeReportsUniquely(reports) {
		var profile = this;
		_.each(reports, function(object, objectKey){
			_.each(object, function(value, key){
		  	// Check if the target already has the key of this object already
		  	if (_.has(profile.template, key)) {
		  		// Now we want to uniquely merge this key into the existing one [we check if its an array to do union or an object to extend]
		  		profile.template[key] = _.isArray(profile.template[key]) ? _.union(profile.template[key], object[key]) : _.extend(profile.template[key], object[key]);
		  	} else profile.template[key] =  object[key];
	  	});
	  });
	}

	/**
	* Merges all the properties of objects into a target
	*
	* @method mergeReports
	* @param {Object} target: the object we need to copy our objects and their properties into
	* @param {Array} reports: An Array of objects on which will be copied into the target
	* @param {Array} excludeList: a set of keys where its elements will be excluded from merge
	*/
	this.mergeReports = function mergeReports(target, reports, excludeList) {

		_.each(reports, function(report, key){
			if (_.indexOf(excludeList, key) == -1) {
		  	// Check if the target already has the key of this object already
		  	if (_.isArray(report)) {
			  	if (_.has(target, key)) {
			  		// Now we want to uniquely merge this key into the existing one [we check if its an array to do union or an object to extend]
			  		_.each(report, function(element, index) {
			  			_.has(target[key],element) ? target[key][element]++ : target[key][element] = 1;
			  		});
			  	} else if (!_.isEmpty(report))
			  	target[key] = _.object(_.zip(report,Array.apply(null, new Array(report.length)).map(Number.prototype.valueOf,1)));

		  	} else mergeAggregatedObject(report, key);
			}
	  });

	  function mergeAggregatedObject(report, key) {

			// the report contains objects, groups, resources, license info, etc.
			_.each(report, function(section, sectionKey) {
				/* if we havent added that object key i.e group to the target then we do by filling it with the keys of the reports
				* being [missing, undefined, etc.] and the value for them is an empty array
				*/

		  	_.each(section, function(element, elementKey) {
					if (_.has(target, key)) {
						if (elementKey == "unreachableTypes") {
							if (!_.has(target[key], "unreachableTypes")) target[key]["unreachableTypes"] = {};
							if (_.has(target[key].unreachableTypes, _.keys(element)[0]))
								target[key]["unreachableTypes"][_.keys(element)[0]]++;
							else {
								target[key]["unreachableTypes"][_.keys(element)[0]] = 1;
							}
						} else {
							if (_.has(target[key], elementKey)) {
					  		// Now we want to uniquely merge this key into the existing one [we check if its an array to do union or an object to extend]
					  		_.each(element, function(elementile) {
					  			_.has(target[key][elementKey],elementile) ? target[key][elementKey][elementile]++ : target[key][elementKey][elementile] = 1;
				  			});
				  		} else if (!_.isEmpty(element)) {
				  			target[key][elementKey] = _.object(_.zip(element,Array.apply(null, new Array(element.length)).map(Number.prototype.valueOf,1)));
				  		}
						}
					} else target[key] = {}
		  	});
			});
	  }
	  return target;
	}

	/**
	* Merges all the unreachable URLS details information
	*
	* @method mergeUnreachableTypes
	* @param {Object} target: the object we need to copy our objects and their properties into
	* @param {Array} reports: An Array of objects on which will be copied into the target
	*/
	this.mergeUnreachableTypes = function mergeUnreachableTypes(target, reports){
		_.each(reports, function(report, key) {
			// only do the merge if the unreachablTypes is found and defined
			if ( key == "unreachableTypes") {
				if (!_.has(target, "unreachableTypes")) target["unreachableTypes"] = {};
				if (_.has(target.unreachableTypes, _.keys(report)[0]))
					target["unreachableTypes"][_.keys(report)[0]]++;
				else {
					target["unreachableTypes"][_.keys(report)[0]] = 1;
				}
			}
		});
		return target;
	}

	/**************************** Printers and Display ****************************/

	/**
	* Prints the report generated line by line
	* the function aggregates the various reports and produce several statistics
	*
	* @method printReport
	*/
	this.printReport = function printReport(report) {
		_.each(report, function(value,key){
			console.log(value);
		});
	}

	/**
	* Prints an aggregated report generated line by line
	* the function aggregates the various reports and produce several statistics
	*
	* @method printAggregatedReport
	*/
	this.printAggregatedReport = function printReport(report) {
		_.each(report, function(number, message){
			console.log("[" + number + "] " + message);
		});
	}

	/**
	* Prints the aggregation report generated in a nice customized way, settings will be read from various setting files
	* the function aggregates the various reports and produce several statistics
	*
	* @method prettyPrintAggregationReport
	*/
	this.prettyPrintAggregationReport = function prettyPrintAggregationReport(total) {

		var profile   = this;
		var report    = this.aggregateReport;

		// print out the report text line by line
		profile.createTitleHead("white", "Metadata Report");
		profile.printAggregatedReport(report.report);
		profile.printStatistics(_.omit(report, ["tag", "resource", "group", "license", "unreachableURLs", "report" ]), "Dataset", total);

		if (report.unreachableURLs) profile.printConnectivityIssues("Dataset", report.unreachableURLs);

		_.each(_.omit(report,["missing", "undefined", "unreachableURLs", "report"]), function(section, sectionKey){
			var sectionKey = util.capitalize(sectionKey);

			profile.createTitleHead("white", sectionKey + " Report");
			profile.printAggregatedReport(section.report);

			// Create the statistics report about the report of each nsection
			var counter = sectionKey == "License" ? total : profile.counter[sectionKey.toLowerCase()];
			profile.printStatistics(_.omit(section, ["unreachableURLs", "report", "unreachableTypes"]), sectionKey, counter, true);
			// Create the connectivity issues report
			profile.printConnectivityIssues(sectionKey, section.unreachableURLs, null, report.resource, true);

		});
	}

	/**
	* Prints the report generated in a nice customized way, settings will be read from various setting files
	* the function aggregates the various reports and produce several statistics
	*
	* @method prettyPrint
	*/
	this.prettyPrint = function prettyPrintReport() {

		var profile   = this;
		var report    = this.template;

		// print out the report text line by line
		profile.createTitleHead("white", "Metadata Report");
		profile.printReport(report.report);
		if (report.unreachableURLs) profile.printConnectivityIssues("Dataset", report.unreachableURLs, true);

		_.each(report, function(section, sectionKey){

			var aggregateReport = {};

			if (!_.isArray(section)) {

				var sectionKey = util.capitalize(sectionKey);

				profile.createTitleHead("white", sectionKey + " Report");

				_.each(section, function(element, elementKey){
						// loop through all the section report sections and print sections titles if there are many
						if (_.size(section) > 1)
							util.colorify("magenta", sectionKey + ": " + util.capitalize(elementKey));

						profile.printReport(element.report);
						// create the statistics now by aggregating the information
						aggregateReport = profile.mergeReports(aggregateReport, element, ["report", "unreachableTypes"]);
						aggregateReport = profile.mergeUnreachableTypes(aggregateReport, element);
				});
				// Create the statistics report about the report of each section
				profile.printStatistics(_.omit(aggregateReport, ["unreachableURLs","unreachableTypes"]), sectionKey, _.size(section));
				// Create the connectivity issues report
				profile.printConnectivityIssues(sectionKey, aggregateReport.unreachableURLs, null, aggregateReport);
			}
		});
	}

	/**
	* Prints statistics related to a specific report
	*
	* @method printStatistics
	* @param {Object} statisticsReport: the object we need to generate statistics for
	* @param {String} key: the key of the object used to show in the printed title
	* * @param {Integer} total: the total number of elements in that report used to generate the statistics
	*/
	this.printStatistics = function printStatistics(statisticsReport, key, total, isAggregate){
		if (statisticsReport && _.size(statisticsReport)) {

		// print the mini spearator for the statsitics section
		this.createTitleHead("cyan", util.capitalize(key) + " Statistics");

		_.each(statisticsReport, function(report, reportType){
			_.each(report, function(value, statistic){
				var text = value == 1 ? "There is one [" + reportType + "] " + statistic + " field" : "There is a total of: " + value + " [" + reportType + "] " + statistic + " fields"
				util.colorify(["yellow","blue"], [text,parseFloat((value / total) * 100).toFixed(2)+ "%"]);
			});
		});
		}

		if (isAggregate) util.colorify("magenta", "Total elements count: " + total);

	}

	/**
	* Prints Connectivity issues related to a specific report
	*
	* @method printConnectivityIssues
	* @param {Array} issues: the array of issues
	* @param {Boolean} isArray: check if the passed issue is an array or not
	*/

	this.printConnectivityIssues = function printConnectivityIssues(sectionKey, issues, isArray, aggregateReport, isAggregate) {

		var profile = this;
		if (issues && _.size(issues) > 0 ) {
			// create the report about connectivity issues surrounding unreachableURLs
			this.createTitleHead("red", util.capitalize(sectionKey) + " Connectivity Issues");
			var aggregateText = _.size(issues) == 1 ? "There is an access issue with one defined URL: " : "There are " + _.size(issues) + " connectivity issues with the following URLs: "
			util.colorify("red", aggregateText);
			_.each(issues, function(dummyValue, URL) {
				isArray ?  console.log("   - " + dummyValue) : console.log("   - " + URL);
			});
		}

		if (!isAggregate || (isAggregate && sectionKey == "Resource"))
			if (_.has(aggregateReport, unreachableTypes)) {

				var unreachableTypes = aggregateReport.unreachableTypes;
				// print the mini spearator for the statsitics section
				profile.createTitleHead("cyan", "Un-Reachable URLs Types");
				_.each(unreachableTypes, function(value, type){
					console.log("There are: " + value + " unreachable URLs of type [" + type + "]");
				});
			}
	}


	/**
	* Prints the title head used for report sections
	*
	* @method createTitleHead
	* @param {String} color: the color of the ext
	* @param {String} title: the section title
	*/
	this.createTitleHead = function createTitleHead(color, title) {
		util.colorify(color, util.createSeparator(80, "=", true) +  util.createSeparator(30, " ") + title + "\n"  + util.createSeparator(80,"="));
	}

	/**************************** Utilities ****************************/

	/**
	* Check if the current profile is empty
	*
	* @method isEmpty
	* @return {Object} return true if the profile is empty, false if not
	*/
	this.isEmpty = function isEmpty() {
		if ( _.isEmpty(this.template.missing) && _.isEmpty(this.template["undefined"]) && _.isEmpty(this.template.unreachableURLs) && _.isEmpty(this.template.report))
			return true
		else return false;
	}

};


module.exports = profile;