var AWS = require('aws-sdk');
var async = require('async');
var helpers = require(__dirname + '/helpers');
var collectors = require(__dirname + '/collectors');
var collection = {};

var AWSConfig = {};

var calls = {
	// CloudFront: {
	// 	listDistributions: {
	// 		property: 'DistributionList',
	// 		secondProperty: 'Items'
	// 	}
	// },
	// CloudTrail: {
	// 	describeTrails: {
	// 		property: 'trailList'
	// 	}
	// },
	// ConfigService: {
	// 	describeConfigurationRecorders: {
	// 		property: 'ConfigurationRecorders'
	// 	},
	// 	describeConfigurationRecorderStatus: {
	// 		property: 'ConfigurationRecordersStatus'
	// 	}
	// },
	// EC2: {
	// 	describeAccountAttributes: {
	// 		property: 'AccountAttributes'
	// 	},
	// 	describeAddresses: {
	// 		property: 'Addresses'
	// 	},
	// 	describeInstances: {
	// 		property: 'Reservations'
	// 	},
	// 	describeSecurityGroups: {
	// 		property: 'SecurityGroups'
	// 	},
	// 	describeVpcs: {
	// 		property: 'Vpcs'
	// 	},
	// 	describeFlowLogs: {
	// 		property: 'FlowLogs'
	// 	}
	// },
	// ELB: {
	// 	describeLoadBalancers: {
	// 		property: 'LoadBalancerDescriptions'
	// 	}
	// },
	IAM: {
		listServerCertificates: {
			property: 'ServerCertificateMetadataList'
		},
		generateCredentialReport: {
			override: true
		}
	},
	// KMS: {
	// 	listKeys: {
	// 		property: 'Keys'
	// 	}
	// },
	// RDS: {
	// 	describeDBInstances: {
	// 		property: 'DBInstances'
	// 	},
	// 	describeDBClusters: {
	// 		property: 'DBClusters'
	// 	}
	// },
	// Route53Domains: {
	// 	listDomains: {
	// 		property: 'Domains'
	// 	}
	// },
	// S3: {
	// 	listBuckets: {
	// 		property: 'Buckets'
	// 	}
	// }
};

var postcalls = [
	{
		S3: [
			'getBucketLogging'
		]
	}
];

// Loop through all of the top-level collectors for each service
async.eachOfLimit(calls, 5, function(call, service, serviceCb){
	var serviceLower = service.toLowerCase();

	if (!collection[serviceLower]) collection[serviceLower] = {};

	// Loop through each of the service's functions
	async.eachOfLimit(call, 5, function(callObj, callKey, callCb){
		if (!collection[serviceLower][callKey]) collection[serviceLower][callKey] = {};

		async.eachLimit(helpers.regions[serviceLower], helpers.MAX_REGIONS_AT_A_TIME, function(region, regionCb){
			//if (settings.skip_regions && settings.skip_regions.indexOf(region)) return regionCb();

			if (!collection[serviceLower][callKey][region]) collection[serviceLower][callKey][region] = {};

			var LocalAWSConfig = JSON.parse(JSON.stringify(AWSConfig));
			LocalAWSConfig.region = region;

			if (callObj.override) {
				collectors[serviceLower][callKey](LocalAWSConfig, collection, function(){
					regionCb();
				});
			} else {
				var executor = new AWS[service](LocalAWSConfig);

				executor[callKey](function(err, data){
					if (err) {
						collection[serviceLower][callKey][region].err = err;
					}
					
					// TODO: pagination
					if (!data) return regionCb();
					if (callObj.property && !data[callObj.property]) return regionCb();
					if (callObj.secondProperty && !data[callObj.secondProperty]) return regionCb();

					if (callObj.secondProperty) {
						collection[serviceLower][callKey][region].data = data[callObj.property][callObj.secondProperty];
					} else {
						collection[serviceLower][callKey][region].data = data[callObj.property];
					}

					regionCb();
				});
			}
		}, function(){
			callCb();
		});
	}, function(){
		serviceCb();
	});
}, function(){
	// Now loop through the follow up calls
	async.eachSeries(postcalls, function(postcallObj, postcallCb){
		async.eachOfLimit(postcallObj, 1, function(serviceArr, service, serviceCb){

		}, function(){
			postcallCb();
		});
	}, function(){
		console.log(JSON.stringify(collection, null, 2));
	});
});