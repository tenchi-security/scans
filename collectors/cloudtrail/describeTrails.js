var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var cloudtrail = new AWS.CloudTrail(AWSConfig);

	cloudtrail.describeTrails(function(err, data){
		if (err) {
			collection.cloudtrail.describeTrails[AWSConfig.region].err = err;
		}
		
		if (data && data.trailList) {
			collection.cloudtrail.describeTrails[AWSConfig.region].data = data.trailList;
		}
		
		callback();
	});
};