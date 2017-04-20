var async = require('async');
var AWS = require('aws-sdk');
var helpers = require('../../helpers');

module.exports = {
	title: 'CloudFront Default Root Object',
	category: 'CloudFront',
	description: 'Detects CloudFront distributions that are missing default root objects',
	more_info: 'A default root object in CloudFront prevents the root path from exposing the distribution contents as a list.',
	link: 'http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html',
	recommended_action: 'Enable a default root object to avoid exposing the distribution contents.',

	run: function(AWSConfig, cache, includeSource, callback) {

		var results = [];
		var source = {};

		var LocalAWSConfig = JSON.parse(JSON.stringify(AWSConfig));

		// Update the region
		LocalAWSConfig.region = 'us-east-1';

		var cloudfront = new AWS.CloudFront(LocalAWSConfig);

		if (includeSource) source['listDistributions'] = {};
		if (includeSource) source['getDistributionConfig'] = {global:[]};

		helpers.cache(cache, cloudfront, 'listDistributions', function(err, data) {
			if (includeSource) source['listDistributions'].global = {error: err, data: data};

			if (err || !data || !data.DistributionList) {
				results.push({
					status: 3,
					message: 'Unable to query for CloudFront distributions',
					region: 'global'
				});

				return callback(null, results, source);
			}

			if (!data.DistributionList.Items || !data.DistributionList.Items.length) {
				results.push({
					status: 0,
					message: 'No CloudFront distributions found',
					region: 'global'
				});

				return callback(null, results, source);
			}

			async.eachLimit(data.DistributionList.Items, 5, function(distribution, cb){
				if (!distribution.Id || !distribution.HttpVersion || !distribution.DomainName) {
					// Skip non-web distributions
					return cb();
				}

				cloudfront.getDistributionConfig({
					Id: distribution.Id
				}, function(gErr, gData){
					if (includeSource) source['getDistributionConfig'].global.push({err:gErr, data: gData});

					if (gErr || !gData || !gData.DistributionConfig) {
						results.push({
							status: 3,
							message: 'Unable to query for CloudFront distribution config',
							resource: distribution.DomainName,
							region: 'global'
						});
					} else if (gData.DistributionConfig.DefaultRootObject) {
						results.push({
							status: 0,
							message: 'CloudFront web distribution default root object set to: ' + gData.DistributionConfig.DefaultRootObject,
							resource: distribution.DomainName,
							region: 'global'
						});
					} else {
						results.push({
							status: 1,
							message: 'CloudFront web distribution is not using a default root object',
							resource: distribution.DomainName,
							region: 'global'
						});
					}

					cb();
				});
			}, function(){
				callback(null, results, source);
			});
		});
	}
};