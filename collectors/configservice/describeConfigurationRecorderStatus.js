var AWS = require('aws-sdk');

module.exports = function(AWSConfig, collection, callback) {
	var configservice = new AWS.ConfigService(AWSConfig);

	configservice.describeConfigurationRecorderStatus(function(err, data){
		if (err) {
			collection.configservice.describeConfigurationRecorderStatus[AWSConfig.region].err = err;
		}
		
		if (data && data.ConfigurationRecordersStatus) {
			collection.configservice.describeConfigurationRecorderStatus[AWSConfig.region].data = data.ConfigurationRecordersStatus;
		}
		
		callback();
	});
};