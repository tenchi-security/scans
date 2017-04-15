var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'CloudTrail Bucket Access Logging',
	category: 'CloudTrail',
	description: 'Ensures CloudTrail logging bucket has access logging enabled to detect tampering of log files',
	more_info: 'CloudTrail buckets should utilize access logging for an additional layer of auditing. If the log files are deleted or modified in any way, the additional access logs can help determine who made the changes.',
	recommended_action: 'Enable access logging on the CloudTrail bucket from the S3 console',
	link: 'http://docs.aws.amazon.com/AmazonS3/latest/UG/ManagingBucketLogging.html',

	run: function(AWSConfig, cache, includeSource, callback) {
		var results = [];
		var source = {};

		async.each(helpers.regions.cloudtrail, function(region, rcb){

			var describeTrails = (cache.cloudtrail &&
								  cache.cloudtrail.describeTrails &&
								  cache.cloudtrail.describeTrails[region]) ?
								  cache.cloudtrail.describeTrails[region] : null;

			if (includeSource) {
				source['describeTrails'] = {};
				source['getBucketLogging'] = {};
				source['describeTrails'][region] = describeTrails;
			}

			if (!describeTrails || describeTrails.err || !describeTrails.data) {
				helpers.addResult(3, 'Unable to query for CloudTrail policy', region);
				return rcb();
			}

			if (!describeTrails.data.length) {
				helpers.addResult(0, 'No S3 buckets to check', region);
				return rcb();
			}

			async.each(describeTrails.data.trailList, function(trail, cb){
				var getBucketLogging = (cache.s3 &&
										cache.s3.getBucketLogging &&
										cache.s3.getBucketLogging[region] &&
										cache.s3.getBucketLogging[region][trail.S3BucketName]) ?
										cache.s3.getBucketLogging[region][trail.S3BucketName] : null;

				if (includeSource) {
					source['getBucketLogging'][region] = getBucketLogging;
				}

				if (!getBucketLogging || getBucketLogging.err || !getBucketLogging.data) {
					helpers.addResult(3,
						'Error querying for bucket policy for bucket: ' + trail.S3BucketName,
						region, 'arn:aws:s3:::' + trail.S3BucketName)

					return cb();
				}

				if (getBucketLogging &&
					getBucketLogging.data &&
					getBucketLogging.data.LoggingEnabled) {
					helpers.addResult(0,
						'Bucket: ' + trail.S3BucketName + ' has S3 access logs enabled',
						region, 'arn:aws:s3:::' + trail.S3BucketName);
				} else {
					helpers.addResult(1,
						'Bucket: ' + trail.S3BucketName + ' has S3 access logs disabled',
						region, 'arn:aws:s3:::' + trail.S3BucketName);
				}

				cb();
			}, function(){
				rcb();
			});
		}, function(){
			callback(null, results, source);
		});
	}
};