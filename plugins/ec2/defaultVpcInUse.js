var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'Default VPC In Use',
	category: 'EC2',
	description: 'Determines whether the default VPC is being used for launching EC2 instances.',
	more_info: 'The default VPC should not be used in order to avoid launching multiple services in the same network which may not require connectivity. Each application, or network tier, should use its own VPC.',
	link: 'http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/default-vpc.html',
	recommended_action: 'Move resources from the default VPC to a new VPC created for that application or resource group.',
	apis: ['EC2:describeVpcs', 'EC2:describeInstances', 'RDS:describeDBInstances'],

	run: function(cache, callback) {
		var results = [];
		var source = {};

		async.each(helpers.regions.vpc, function(region, rcb){
			var describeVpcs = helpers.addSource(cache, source,
				['ec2', 'describeVpcs', region]);

			if (!describeVpcs) return rcb();

			if (describeVpcs.err || !describeVpcs.data) {
				helpers.addResult(results, 3,
					'Unable to query for VPCs: ' + helpers.addError(describeVpcs), region);
				return rcb();
			}

			if (!describeVpcs.data.length) {
				helpers.addResult(results, 0, 'No VPCs present', region);
				return rcb();
			}

			var defaultVpcId;

			for (v in describeVpcs.data) {
				var vpc = describeVpcs.data[v];
				if (vpc.IsDefault) {
					defaultVpcId = vpc.VpcId;
					break;
				}
			}

			if (!defaultVpcId) {
				helpers.addResult(results, 0,
					'No default VPC found', region);
				return rcb();
			}

			// Query for EC2 instances
			var describeInstances = helpers.addSource(cache, source,
				['ec2', 'describeInstances', region]);

			if (describeInstances.err || !describeInstances.data) {
				helpers.addResult(results, 3,
					'Unable to query for EC2 instances in VPC: ' + helpers.addError(describeInstances), region, defaultVpcId);
				return rcb();
			}

			// Query for RDS instances
			var describeDBInstances = helpers.addSource(cache, source,
				['rds', 'describeDBInstances', region]);

			if (describeDBInstances.err || !describeDBInstances.data) {
				helpers.addResult(results, 3,
					'Unable to query for RDS instances in VPC: ' + helpers.addError(describeDBInstances), region, defaultVpcId);
				return rcb();
			}

			if (!describeInstances.data.length && !describeDBInstances.data.length) {
				helpers.addResult(results, 0,
					'No EC2 or RDS instances found in VPC', region, defaultVpcId);
			}

			var ec2Instances = 0;
			var rdsInstances = 0;

			for (r in describeInstances.data) {
				if (describeInstances.data[r].Instances) {
					ec2Instances += describeInstances.data[r].Instances.length;
				}
			}

			rdsInstances += describeDBInstances.data.length;
				

			if (ec2Instances === 0 && rdsInstances === 0) {
				helpers.addResult(results, 0,
					'Default VPC is not in use', region, defaultVpcId);
			} else {
				helpers.addResult(results, 2,
					'Default VPC is in use (' + ec2Instances + ' EC2 instances and ' + rdsInstances + ' RDS instances)',
					region, defaultVpcId);
			}

			rcb();
		}, function(){
			callback(null, results, source);
		});
	}
};
