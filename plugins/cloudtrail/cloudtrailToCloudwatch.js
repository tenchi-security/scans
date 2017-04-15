var AWS = require('aws-sdk');
var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'CloudTrail To CloudWatch',
	category: 'CloudTrail',
	description: 'Ensures CloudTrail logs are being properly delivered to CloudWatch',
	more_info: 'Sending CloudTrail logs to CloudWatch enables easy integration with AWS CloudWatch alerts, as well as an additional backup log storage location.',
	recommended_action: 'Enable CloudTrail CloudWatch integration for all regions',
	link: 'http://docs.aws.amazon.com/awscloudtrail/latest/userguide/send-cloudtrail-events-to-cloudwatch-logs.html',

	run: function(AWSConfig, cache, includeSource, callback) {
		var results = [];
		var source = {};

		async.each(helpers.regions.cloudtrail, function(region, cb){
			var describeTrails = (cache.cloudtrail &&
								  cache.cloudtrail.describeTrails &&
								  cache.cloudtrail.describeTrails[region]) ?
								  cache.cloudtrail.describeTrails[region] : null;

			if (includeSource) {
				source['describeTrails'] = {};
				source['describeTrails'][region] = describeTrails;
			}

			if (!describeTrails || describeTrails.err || !describeTrails.data) {
				helpers.addResult(3, 'Unable to query for CloudTrail CloudWatch integration status', region);
				return rcb();
			}

			if (!describeTrails.data.length) {
				helpers.addResult(2, 'CloudTrail is not enabled', region);
			} else if (describeTrails.data[0]) {
				for (t in describeTrails.data) {
					if (!describeTrails.data[t].CloudWatchLogsLogGroupArn) {
						helpers.addResult(2, 'CloudTrail CloudWatch integration is not enabled',
							region, describeTrails.data[t].TrailARN)
					} else {
						helpers.addResult(0, 'CloudTrail CloudWatch integration is enabled',
							region, describeTrails.data[t].TrailARN)
					}
				}
			} else {
				helpers.addResult(2, 'CloudTrail is enabled but is not properly configured', region);
			}
			cb();
		}, function(){
			callback(null, results, source);
		});
	}
};