var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var ec2 = new AWS.EC2(AWSConfig);

	ec2.describeInstances(function(err, data){
		if (err) {
			collection.ec2.describeInstances[AWSConfig.region].err = err;
		}
		
		if (data && data.Reservations) {
			collection.ec2.describeInstances[AWSConfig.region].data = data.Reservations;
		}
		
		callback();
	});
};