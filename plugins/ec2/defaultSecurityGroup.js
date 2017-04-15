var AWS = require('aws-sdk');
var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'Default Security Group',
	category: 'EC2',
	description: 'Ensure the default security groups block all traffic by default',
	more_info: 'The default security group is often used for resources launched without a defined security group. For this reason, the default rules should be to block all traffic to prevent an accidental exposure.',
	link: 'http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html#default-security-group',
	recommended_action: 'Update the rules for the default security group to deny all traffic by default',

	run: function(AWSConfig, cache, includeSource, callback) {
		var results = [];
		var source = {};

		async.each(helpers.regions.ec2, function(region, rcb){
			var describeSecurityGroups = (cache.ec2 &&
										  cache.ec2.describeSecurityGroups &&
										  cache.ec2.describeSecurityGroups[region]) ?
										  cache.ec2.describeSecurityGroups[region] : null;

			if (includeSource) {
				source['describeSecurityGroups'] = {};
				source['describeSecurityGroups'][region] = describeSecurityGroups;
			}

			if (!describeSecurityGroups || describeSecurityGroups.err || !describeSecurityGroups.data) {
				helpers.addResult(3, 'Unable to query for security groups', region);
				return rcb();
			}

			if (!describeSecurityGroups.data.length) {
				helpers.addResult(0, 'No security groups present', region);
				return rcb();
			}

			for (s in describeSecurityGroups.data.SecurityGroups) {
				var sg = describeSecurityGroups.data.SecurityGroups[s];

				if (sg.GroupName === 'default') {
					if (sg.IpPermissions.length ||
					 	sg.IpPermissionsEgress.length) {
						helpers.addResult(2,
							'Default security group has ' + sg.IpPermissions.length + ' inbound and ' + sg.IpPermissionsEgress.length + ' outbound rules',
							region, sg.GroupId);
					} else {
						helpers.addResult(0,
							'Default security group does not have inbound or outbound rules',
							region, sg.GroupId);
					}
				}
			}

			rcb();
		}, function(){
			callback(null, results, source);
		});
	}
};
