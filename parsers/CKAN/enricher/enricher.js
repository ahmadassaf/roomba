var datasetEnricher = require('./datasetEnricher');

var extend          = require('extend');

function enricher(parent) {

	extend(this, parent);

	this.datasetEnricher = new datasetEnricher(this);

};

enricher.prototype.enrichDataset = function enrichDataset(parserInterfaceCallback) {
	this.datasetEnricher.enrichDataset(parserInterfaceCallback);
}

module.exports = enricher;
