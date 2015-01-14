var extend = require('extend');

function reportFactory(parent) {

	extend(this, parent);

	var reportFactory = this;
	var _             = this.util._;

	this.getObjectKeyValues = function getObjectKeyValues(dataset, field, executionCallback) {

		var obj  = {};
		var root = dataset.result ? dataset.result : dataset;

		// We will be splitting the field to extract the values needed to be aggregated
		var objectKeyValues = field.split(":");
		// Check if the key value is shallow or is a composite key
		var keyPathArray = objectKeyValues[0].split(">");

		// Add the key values in the main object
		if (keyPathArray.length == 1) {
			// The path is shallow with no hierarchies defined, only one element
			if (root[keyPathArray]) obj[root[keyPathArray]] = [];
		} else if (_.isArray(root[keyPathArray[0]])) {
				_.each(root[keyPathArray[0]], function(child){
					if (child[keyPathArray[1]] && !_.has(obj, child[keyPathArray[1]])) obj[child[keyPathArray[1]]] = [];
				});
			} else if (root[keyPathArray[0]] && root[keyPathArray[0]][keyPathArray[1]])
									obj[root[keyPathArray[0]][keyPathArray[1]]] = [];

		// iterate through all the keys entered and fill up the value information in each key
		_.each(obj, function(value, key){
			// Handle the value aggregation by also checking if there is a composite hierarchy
			var objectPathArray = objectKeyValues[1].split(">");
			if (objectPathArray.length == 1) {
				// The path is shallow with no hierarchies defined, only one element
				if (root[objectPathArray[0]]) obj[key].push(root[objectPathArray[0]]);
			} else {
				_.each(root[objectPathArray[0]], function(child){
					if (child[objectPathArray[1]]) obj[key].push(child[objectPathArray[1]]);
				});
			}
		});
		executionCallback(false, obj);
	}

	this.getFieldValues = function getFieldValues(dataset, field, executionCallback) {

		var types = [];
		var root  = dataset.result ? dataset.result : dataset;

		// Construct the path array by splitting on the > hierarchy symbol
		var pathArray = field.split(">");
		if (pathArray.length == 1) {
			// The path is shallow with no hierarchies defined, only one element
			if (root[field]) types.push(root[field]);
		} else {
			_.each(root[pathArray[0]], function(child){
				if (child[pathArray[1]]) types.push(child[pathArray[1]]);
			});
		}
		executionCallback(false, _.uniq(types));
	}
}

module.exports = reportFactory;

