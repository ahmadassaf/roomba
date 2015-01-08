var extend = require('extend');

function datasetEnricher(parent) {

	extend(this, parent);

	var datasetEnricher = this;

	this.enrichDataset = function enrichDataset(profilerCallback) {
	}
}

module.exports = datasetEnricher;


// On Enricing success callback is: profilerCallback(false, false, {type: "info", message: "enriching"});
/*
	-> Checking for valid .csv files structure
	var parse = require('csv-parse');
	parse(body, {comment: '#'}, function(err, output){
	  console.log(output);
	});
 */

