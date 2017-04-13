var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var configservice = new AWS.ConfigService(AWSConfig);

	configservice.describeConfigurationRecorders(function(err, data){
		if (err) {
			collection.configservice.describeConfigurationRecorders[AWSConfig.region].err = err;
		}
		
		if (data && data.ConfigurationRecorders) {
			collection.configservice.describeConfigurationRecorders[AWSConfig.region].data = data.ConfigurationRecorders;
		}
		
		callback();
	});
};