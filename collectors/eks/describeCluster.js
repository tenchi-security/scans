var AWS = require('aws-sdk');
var async = require('async');

module.exports = function(AWSConfig, collection, callback) {
    var eks = new AWS.EKS(AWSConfig);

    async.eachLimit(collection.eks.listClusters[AWSConfig.region].data, 15, function(cluster, cb){
        collection.eks.describeCluster[AWSConfig.region][cluster] = {};
        var params = {
            'name': cluster
        };
        eks.describeCluster(params, function(err, data) {
            if (err) {
                collection.eks.describeCluster[AWSConfig.region][cluster].err = err;
            }
            collection.eks.describeCluster[AWSConfig.region][cluster].data = data;
            cb();
        });
                
    }, function(){
        callback();
    });
};
