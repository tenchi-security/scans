var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var cloudfront = new AWS.CloudFront(AWSConfig);

	cloudfront.listDistributions(function(err, data){
		if (err) {
			collection.cloudfront.listDistributions[AWSConfig.region].err = err;
		}
		
		// TODO: pagination
		if (data && data.DistributionList && data.DistributionList.Items) {
			collection.cloudfront.listDistributions[AWSConfig.region].data = data.DistributionList.Items;
		}
		
		callback();
	});
};