var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var ec2 = new AWS.EC2(AWSConfig);

	ec2.describeAddresses(function(err, data){
		if (err) {
			collection.ec2.describeAddresses[AWSConfig.region].err = err;
		}
		
		if (data && data.Addresses) {
			collection.ec2.describeAddresses[AWSConfig.region].data = data.Addresses;
		}
		
		callback();
	});
};