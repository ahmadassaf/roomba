var parser = require('../parserInterface');

var util   = require('util');

function socrata(options, utilities, cache, url) {

	var parentStart = this.start;

	parser.apply(this,arguments);

	this.start = function start(dataParserCallback) {

		parentStart.apply(this);
		dataParserCallback(null, {type: "warning" , message : "unsupportedPortal"});
	}

}

util.inherits(socrata, parser);

socrata.prototype.check = function check($, dataParserCallback) {
	var socrataParser = this;
	if ($('meta[content*="socrata"]').length !== 0 ) {
		socrataParser.start(function(error, message) {
			// If the portal has been identified by not yet supported
				dataParserCallback(error,message);
		});
		// this URL is not identified as the current portal type: Socrata
	} else dataParserCallback(null,false);
}

module.exports = socrata;