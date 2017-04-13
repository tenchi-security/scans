var AWS = require('aws-sdk');
var async = require('async');
var helpers = require(__dirname + '/helpers');
var collectors = require(__dirname + '/collectors');
var collection = {};

var AWSConfig = {};

var calls = {
	CloudFront: {
		listDistributions: {
			property: 'DistributionList',
			secondProperty: 'Items'
		}
	},
	CloudTrail: {
		describeTrails: {
			property: 'trailList'
		}
	},
	ConfigService: {
		describeConfigurationRecorders: {
			property: 'ConfigurationRecorders'
		},
		describeConfigurationRecorderStatus: {
			property: 'ConfigurationRecordersStatus'
		}
	},
	EC2: {
		describeAccountAttributes: {
			property: 'AccountAttributes'
		},
		describeAddresses: {
			property: 'Addresses'
		},
		describeInstances: {
			property: 'Reservations'
		},
		describeSecurityGroups: {
			property: 'SecurityGroups'
		}
	},
	ELB: {
		describeLoadBalancers: {
			property: 'LoadBalancerDescriptions'
		}
	}
};

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
				callObj.override(LocalAWSConfig, collection, function(){
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
	console.log(JSON.stringify(collection, null, 2));
});


// Loop through all of the top-level collectors for each service
// async.eachOfLimit(collectors, 5, function(collector, service, serviceCb){
// 	if (!collection[service]) collection[service] = {};

// 	// Loop through each of the service's functions
// 	async.eachOfLimit(collector, 5, function(callFunction, callKey, callCb){
// 		if (!collection[service][callKey]) collection[service][callKey] = {};

// 		async.eachLimit(helpers.regions[service], helpers.MAX_REGIONS_AT_A_TIME, function(region, regionCb){
// 			//if (settings.skip_regions && settings.skip_regions.indexOf(region)) return regionCb();

// 			if (!collection[service][callKey][region]) collection[service][callKey][region] = {};

// 			var LocalAWSConfig = JSON.parse(JSON.stringify(AWSConfig));
// 			LocalAWSConfig.region = region;

// 			callFunction(LocalAWSConfig, collection, function(){
// 				regionCb();
// 			});
// 		}, function(){
// 			callCb();
// 		});
// 	}, function(){
// 		serviceCb();
// 	});
// }, function(){
// 	console.log(JSON.stringify(collection, null, 2));
// });