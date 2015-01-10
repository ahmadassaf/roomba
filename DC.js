var dataset_parser = require('./datasetParser');
var options        = require('./options.json');
var messages       = require('./util/messages');
var util           = require('./util/utils');
var cache          = require('./util/cache');

function DC() {

	this.util        = new util(options, messages[options.locale]);
	this.options     = this.util._.extend(options, messages[options.locale]);
	this.cache       = new cache(__dirname, this.options.cacheFolderName);
}

DC.prototype.start = function start() {

	// Getting the specified messages language in options.json
	var DC = this;

	DC.util.console("info", "welcomeMessage");

	/*
		 We will prompt the user to enter a datahub URI, this URI will be checked for its validity
		 if it wasn't valid then we will re-prompt the user to enter a new URI
		 if successfull then we will pass it for the parser
	*/

	DC.util.checkValidAddress(DC.options.prompt.URLEntry, function(error, url, body){
		if (!error && body) new dataset_parser(DC.options, DC.util, DC.cache).start(url, body);
	});

}

new DC().start();