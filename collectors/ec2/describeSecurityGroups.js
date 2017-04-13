var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var ec2 = new AWS.EC2(AWSConfig);

	ec2.describeSecurityGroups(function(err, data){
		if (err) {
			collection.ec2.describeSecurityGroups[AWSConfig.region].err = err;
		}
		
		if (data && data.SecurityGroups) {
			collection.ec2.describeSecurityGroups[AWSConfig.region].data = data.SecurityGroups;
		}
		
		callback();
	});
};