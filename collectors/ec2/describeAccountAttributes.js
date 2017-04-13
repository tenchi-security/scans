var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var ec2 = new AWS.EC2(AWSConfig);

	ec2.describeAccountAttributes(function(err, data){
		if (err) {
			collection.ec2.describeAccountAttributes[AWSConfig.region].err = err;
		}
		
		if (data && data.AccountAttributes) {
			collection.ec2.describeAccountAttributes[AWSConfig.region].data = data.AccountAttributes;
		}
		
		callback();
	});
};