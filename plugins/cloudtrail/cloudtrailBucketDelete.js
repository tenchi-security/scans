var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'CloudTrail Bucket Delete Policy',
	category: 'CloudTrail',
	description: 'Ensures CloudTrail logging bucket has a policy to prevent deletion of logs without an MFA token',
	more_info: 'To provide additional security, CloudTrail logging buckets should require an MFA token to delete objects',
	recommended_action: 'Enable MFA delete on the CloudTrail bucket',
	link: 'http://docs.aws.amazon.com/AmazonS3/latest/dev/Versioning.html#MultiFactorAuthenticationDelete',

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
				source['getBucketVersioning'] = {};
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

			async.each(describeTrails.data, function(trail, cb){
				var getBucketVersioning = (cache.s3 &&
										   cache.s3.getBucketVersioning &&
										   cache.s3.getBucketVersioning[region] &&
										   cache.s3.getBucketVersioning[region][trail.S3BucketName]) ?
										   cache.s3.getBucketVersioning[region][trail.S3BucketName] : null;

				if (includeSource) {
					source['getBucketVersioning'][region] = getBucketVersioning;
				}

				if (!getBucketVersioning || getBucketVersioning.err || !getBucketVersioning.data) {
					helpers.addResult(3,
						'Error querying for bucket policy for bucket: ' + trail.S3BucketName,
						region, 'arn:aws:s3:::' + trail.S3BucketName)

					return cb();
				}

				if (getBucketVersioning && getBucketVersioning.MFADelete &&
					getBucketVersioning.MFADelete === 'Enabled') {
					helpers.addResult(0,
						'Bucket: ' + trail.S3BucketName + ' has MFA delete enabled',
						region, 'arn:aws:s3:::' + trail.S3BucketName);
				} else {
					helpers.addResult(1,
						'Bucket: ' + trail.S3BucketName + ' has MFA delete disabled',
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