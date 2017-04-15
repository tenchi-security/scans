var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'Config Service Enabled',
	category: 'ConfigService',
	description: 'Ensures the AWS Config Service is enabled to detect changes to account resources',
	more_info: 'The AWS Config Service tracks changes to a number of resources in an AWS account and is invaluable in determining how account changes affect other resources and in recovery in the event of an account intrusion or accidental configuration change.',
	recommended_action: 'Enable the AWS Config Service for all regions and resources in an account. Ensure that it is properly recording and delivering logs.',
	link: 'https://aws.amazon.com/config/details/',

	run: function(AWSConfig, cache, includeSource, callback) {
		var results = [];
		var source = {};

		var globalServicesMonitored = false;

		async.each(helpers.regions.configservice, function(region, rcb){
			var describeConfigurationRecorders = (cache.configservice &&
				  cache.configservice.describeConfigurationRecorders &&
				  cache.configservice.describeConfigurationRecorders[region]) ?
				  cache.configservice.describeConfigurationRecorders[region] : null;

			var describeConfigurationRecorderStatus = (cache.configservice &&
				  cache.configservice.describeConfigurationRecorderStatus &&
				  cache.configservice.describeConfigurationRecorderStatus[region]) ?
				  cache.configservice.describeConfigurationRecorderStatus[region] : null;

			if (includeSource) {
				source['describeConfigurationRecorders'] = {};
				source['describeConfigurationRecorderStatus'] = {};
				source['describeConfigurationRecorders'][region] = describeConfigurationRecorders;
				source['describeConfigurationRecorderStatus'][region] = describeConfigurationRecorderStatus;
			}

			if (describeConfigurationRecorders &&
				describeConfigurationRecorders.data &&
				describeConfigurationRecorders.data.ConfigurationRecorders &&
				describeConfigurationRecorders.data.ConfigurationRecorders[0] &&
				describeConfigurationRecorders.data.ConfigurationRecorders[0].recordingGroup &&
				describeConfigurationRecorders.data.ConfigurationRecorders[0].recordingGroup.includeGlobalResourceTypes) {
				globalServicesMonitored = true;
			}

			if (!describeConfigurationRecorderStatus ||
				describeConfigurationRecorderStatus.err ||
				!describeConfigurationRecorderStatus.data ||
				!describeConfigurationRecorderStatus.data.ConfigurationRecordersStatus) {
				helpers.addResults(3, 'Unable to query for Config Service status', region);
				return rcb();
			}

			if (describeConfigurationRecorderStatus.data.ConfigurationRecordersStatus[0]) {
				var crs = describeConfigurationRecorderStatus.data.ConfigurationRecordersStatus[0];

				if (crs.recording) {
					if (crs.lastStatus &&
						(crs.lastStatus == 'SUCCESS' ||
						 crs.lastStatus == 'PENDING')) {
						helpers.addResults(0,
							'Config Service is configured, recording, and delivering properly', region);
					} else {
						helpers.addResults(1,
							'Config Service is configured, and recording, but not delivering properly', region);
					}
				} else {
					helpers.addResults(2, 'Config Service is configured but not recording', region);
				}

				return rcb();
			}

			helpers.addResults(2, 'Config Service is not configured', region);

			rcb();
		}, function(){
			if (!globalServicesMonitored) {
				helpers.addResults(2, 'Config Service is not monitoring global services');
			} else {
				helpers.addResults(0, 'Config Service is monitoring global services');
			}

			callback(null, results, source);
		});
	}
};