var cheerio  = require('cheerio');

var CKAN     = require('./parsers/CKAN/CKAN');
var DKAN     = require('./parsers/DKAN/DKAN');
var socrata  = require('./parsers/socrata/socrata');
var datatank = require('./parsers/datatank/datatank');

function dataset_parser(options, util, cache) {
	this.options  = options;
	this.util     = util;
	this.cache    = cache;
};

dataset_parser.prototype.start = function start(url, body) {

	var dataset_parser = this;
	var $              = cheerio.load(body);

	var CKANParser     = new CKAN(dataset_parser.options , dataset_parser.util, dataset_parser.cache, url);
	var DKANParser     = new DKAN(dataset_parser.options , dataset_parser.util, dataset_parser.cache, url);
	var socrataParser  = new socrata(dataset_parser.options , dataset_parser.util, dataset_parser.cache, url);
	var datatankParser = new datatank(dataset_parser.options , dataset_parser.util, dataset_parser.cache, url);

	CKANParser.check($, function(error, CKANSuccess) {
		if (!error) DKANParser.check($, function(error, DKANSuccess){
			if (!error) socrataParser.check($, function(error, socrataSuccess){
				if (!error) datatankParser.check($, function(error, datatankSuccess){

					// The Portal has not been matched with any of the automatic tests, ask for manual entry from the user
					var message = CKANSuccess ||  DKANSuccess || socrataSuccess || datatankSuccess || {type: "warning", message: "invalidPortalURL"};
					dataset_parser.util.console(message.type, message.message);

					dataset_parser.util.checkValidAddress(dataset_parser.options.prompt.manualPortalURLEntry, function(error, url, body){
						if (!error && body) dataset_parser.start(url, body);
					});

				});
			});
		});
	});

}

// Export the Parser constructor from this module.
module.exports = dataset_parser;