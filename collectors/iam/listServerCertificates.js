var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var elb = new AWS.ELB(AWSConfig);

	elb.describeLoadBalancers(function(err, data){
		if (err) {
			collection.elb.describeLoadBalancers[AWSConfig.region].err = err;
		}
		
		if (data && data.LoadBalancerDescriptions) {
			collection.elb.describeLoadBalancers[AWSConfig.region].data = data.LoadBalancerDescriptions;
		}
		
		callback();
	});
};