var parser = require('../parserInterface');

var util   = require('util');

function DKAN(options, utilities, cache, url) {

	var parentStart = this.start;

	parser.apply(this,arguments);

	this.start = function start(dataParserCallback) {

		parentStart.apply(this);
		dataParserCallback(null, {type: "warning" , message : "unsupportedPortal"});
	}
}

util.inherits(DKAN, parser);

DKAN.prototype.check = function check($, dataParserCallback) {
	var DKANParser = this;
	if ($('meta[content*="Drupal"]').length !== 0 ) {
		DKANParser.start(function(error, message) {
				dataParserCallback(error,message);
		});
		// this URL is not identified as the current portal type: DKAN
	} else dataParserCallback(null,false);
}

module.exports = DKAN;