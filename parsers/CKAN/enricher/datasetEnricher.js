var extend = require('extend');

function datasetEnricher(parent) {

	extend(this, parent);

	var datasetEnricher = this;

	this.enrichDataset = function enrichDataset(profilerCallback) {
	}
}

module.exports = datasetEnricher;

