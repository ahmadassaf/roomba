var parent   = require('../parserInterface');
var CKANUtil = require('./util');

var crawler  = require('./crawler/crawler');
var parser   = require('./parser/parser');
var profiler = require('./profiler/profiler');
var enricher = require('./enricher/enricher');
var reporter = require('./reporter/reporter');

var util     = require('util');

function CKAN(options, util, cache, url) {

	parent.apply(this,arguments);

	// This is the inherited start function from the generic parser module
	var parentStart     = this.start;

	this.portalName     = this.util.getPortalName(url);
	this.datasetsFolder = this.portalName  + '/datasets/';
	this.groupsFolder   = this.portalName  + '/groups/';
	this.profilesFolder = this.portalName  + '/profiles/';
	this.reportsFolder  = this.portalName  + '/reports/';
	this.enrichedFolder = this.portalName  + '/enriched/';
	this.qualityFolder  = this.portalName  + '/quality/';
	this.API_path       = "/api/action/";
	this.API_endpoints  = {
		"datasets_list"      : "package_list",
		"groups_list"        : "group_list",
		"group_description"  : "group_show?id=",
		"dataset_description": "package_show?id="
	};

	this.start =  function start(dataParserCallback, isRetry, message) {

		// Inject modules dependency over those who require them i.e. parser before crawler
		this.CKANUtil = new CKANUtil(this);

		this.parser   = new parser(this);
		this.crawler  = new crawler(this);
		this.profiler = new profiler(this);
		this.enricher = new enricher(this);
		this.reporter = new reporter(this);

		// Check if the list menu is repreinted after function success or is a first time run
		if (!isRetry) parentStart.apply(this);
			else this.util.console(message.type, message.message);

		var CKANParser     = this;
		CKANParser.getAction(function(action){
				CKANParser.executeAction(CKANParser, action, function(error, message) {
					error ? dataParserCallback(false, message) : CKANParser.start(dataParserCallback, true, message);
				});
		});
	}
}

// The inherit function is invoked after the constructor
util.inherits(CKAN, parent);

/* This function will check the body of the html portal for existing signs to know the portal type
 * usuall the examination is on the url of the portal or the <meta> tags
 *
 * @param {Object} $: The parsed HTML file of the data portal for cheerio
 * @param {Function} dataParserCallback(error, success)
 *        The return function that will handle the parsing
 *        Always return false as error to indicate the completion of the function (A true error will exit the application)
 *        message is a message we want to present to the user upon sending him back to manual url entry
 *        false message means that the portal was not identified
*/

CKAN.prototype.check = function check($, dataParserCallback) {
	var CKANParser = this;
	if ($('meta[content*="ckan"]').length !== 0 || CKANParser.url.indexOf("ckan") > -1 )  {
		CKANParser.start(function(error, message) {
				dataParserCallback(error, message);
		});
		// this URL is not identified as the current portal type: CKAN
	} else dataParserCallback(null,false);
}

module.exports = CKAN;