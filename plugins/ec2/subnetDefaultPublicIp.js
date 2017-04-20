var AWS = require('aws-sdk');
var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'Subnet Default Public IP',
	category: 'EC2',
	description: 'Determine if instances launched in a subnet are given a public IP by default.',
	more_info: 'Subnets can be configured to distribute public IP addresses to instances launched within. This setting should be disabled for all private subnets to prevent publically exposing instances by default.',
	link: 'http://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_Subnet.html',
	recommended_action: 'Set this property to false unless the subnet is specifically allocated for publically available instances.',

	run: function(AWSConfig, cache, includeSource, callback) {
		var results = [];
		var source = {};

		async.eachLimit(helpers.regions.ec2, helpers.MAX_REGIONS_AT_A_TIME, function(region, rcb){
			var LocalAWSConfig = JSON.parse(JSON.stringify(AWSConfig));

			// Update the region
			LocalAWSConfig.region = region;
			var ec2 = new AWS.EC2(LocalAWSConfig);

			if (includeSource) source['describeSubnets'] = {};

			helpers.cache(cache, ec2, 'describeSubnets', function(err, data) {
				if (includeSource) source['describeSubnets'][region] = {error: err, data: data};

				if (err || !data || !data.Subnets || !data.Subnets.length) {
					results.push({
						status: 3,
						message: 'Unable to query for subnets',
						region: region
					});

					return rcb();
				}

				// Loop through response to assign custom limits
				for (i in data.Subnets) {
					if (data.Subnets[i].MapPublicIpOnLaunch &&
						data.Subnets[i].MapPublicIpOnLaunch !== "false") {
						results.push({
							status: 1,
							message: 'Subnet is set to map public IP on launch',
							resource: data.Subnets[i].SubnetId,
							region: region
						});
					}
				}

				if (!results.length) {
					results.push({
						status: 0,
						message: 'All subnets are configured to not assign public IP on launch',
						region: region
					});
				}
				
				rcb();
			});
		}, function(){
			return callback(null, results, source);
		});
	}
};