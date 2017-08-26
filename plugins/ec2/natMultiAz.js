var async = require('async');
var helpers = require('../../helpers');

module.exports = {
    title: 'NAT Multiple AZ',
    category: 'EC2',
    description: 'Ensures managed NAT instances exist in at least 2 AZs for availability purposes.',
    more_info: 'Creating NAT instances in a single AZ creates a single point of failure for all systems in the VPC. All managed NAT instances should be created in multiple AZs to ensure proper failover.',
    link: 'http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-nat-gateway.html',
    recommended_action: 'Launch managed NAT instances in multiple AZs.',
    apis: ['EC2:describeNatGateways'],

    run: function(cache, callback) {
        var results = [];
        var source = {};
        async.each(helpers.regions.ec2, function(region, rcb){
            var describeNatGateways = helpers.addSource(cache, source,
                ['ec2', 'describeNatGateways', region]);

            if (!describeNatGateways) return rcb();

            if (describeNatGateways.err || !describeNatGateways.data) {
                helpers.addResult(results, 3,
                    'Unable to query for NAT gateways: ' + 
                    helpers.addError(describeNatGateways), region);
                return rcb();
            }

            if (!describeNatGateways.data.length) {
                helpers.addResult(results, 0, 'No NAT gateways found', region);
                return rcb();
            }

            var vpcMap = {};

            // loop through nat gateways
            describeNatGateways.data.forEach(function(Ngw){
                if (!vpcMap[Ngw.VpcId]) vpcMap[Ngw.VpcId] = [];
                if (vpcMap[Ngw.VpcId].indexOf(Ngw.SubnetId) === -1) {
                    vpcMap[Ngw.VpcId].push(Ngw.SubnetId);
                }
            });

            var found = false;

            // Find VPCs with only 1 NGW or all NGWs in 1 subnet
            for (v in vpcMap) {
                if (!vpcMap[v].length) continue;
                found = true;

                if (vpcMap[v].length === 1) {
                    helpers.addResult(results, 2, 'NAT gateways only found in 1 subnet AZ', region, v);
                } else {
                    helpers.addResult(results, 0, 'NAT gateways found in ' + vpcMap[v].length + ' subnet AZs', region, v);
                }
            }

            if (!found) {
                helpers.addResult(results, 0, 'No VPCs with NAT gateways found', region);
            }


            rcb();
        }, function(){
            callback(null, results, source);
        });
    }
};
