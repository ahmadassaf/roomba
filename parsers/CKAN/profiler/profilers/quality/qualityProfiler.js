var profile           = require('../profile');

var completeness      = require('./measures/completeness');
var availability      = require('./measures/availability');
var licensing         = require('./measures/licensing');
var freshness         = require('./measures/freshness');
var correctness       = require('./measures/correctness');
var comprehensibility = require('./measures/comprehensibility');
var provenance        = require('./measures/provenance');

var extend            = require('extend');

function qualityProfiler(parent) {

	extend(this, parent);

	var _               = this.util._;
	var qualityProfiler = this;

	var profileTemplate = new profile(this);

	this.start = function start(dataset, profilerCallback) {

		if (dataset) {

			// There is a valid dataset metadata file (Q1.1)
			profileTemplate.setQualityIndicatorScore("completeness", "QI.1", 1);

			var root   = dataset.result ? dataset.result : dataset;

			/* TO DO: Check the performance of parallel vs. Waterfall for the calculations
			 * There has been some miscalculation in the numbers between both, revise and measure performance gain
			this.async.parallel({
				completeness      : new completeness      ( qualityProfiler, dataset).start.bind(null, profileTemplate),
				provenance        : new provenance        ( qualityProfiler, dataset).start.bind(null, profileTemplate),
				freshness         : new freshness         ( qualityProfiler, dataset).start.bind(null, profileTemplate),
				comprehensibility : new comprehensibility ( qualityProfiler, dataset).start.bind(null, profileTemplate),
				licensing         : new licensing         ( qualityProfiler, dataset).start.bind(null, profileTemplate)
			}, function (err) {
				profilerCallback(false, profileTemplate, new profile(this));
			});
			*/

			this.async.waterfall([

				qualityProfiler.async.apply(new completeness(qualityProfiler, dataset).start, profileTemplate),
				new provenance(qualityProfiler, dataset).start,
				new freshness(qualityProfiler, dataset).start,
				new comprehensibility(qualityProfiler, dataset).start,
				new licensing(qualityProfiler, dataset).start

			], function (err, profileTemplate) {
				profilerCallback(false, profileTemplate, new profile(this));
			});
		} else profilerCallback(false, profileTemplate, new profile(this));
	}
};

module.exports = qualityProfiler;