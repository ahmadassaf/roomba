var parser = require('../parserInterface');

var util   = require('util');

function datatank(options, utilities, cache, url) {

	var parentStart = this.start;

	parser.apply(this,arguments);

	this.start = function start(dataParserCallback) {

		parentStart.apply(this);
		dataParserCallback(null, {type: "warning" , message : "unsupportedPortal"});
	}
}

util.inherits(datatank, parser);

datatank.prototype.check = function check($, dataParserCallback) {
	var datatankParser = this;
	if ( $('meta[content*="Datatank"]').length !== 0 ) {
		datatankParser.start(function(error, message) {
				dataParserCallback(error,message);
		});
		// this URL is not identified as the current portal type: datatank
	} else dataParserCallback(null,false);
}

module.exports = datatank;