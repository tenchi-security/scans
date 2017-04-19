var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'Empty Groups',
	category: 'IAM',
	description: 'Ensures all groups have at least one member',
	more_info: 'While having empty groups does not present a direct security risk, it does broaden the management landscape which could potentially introduce risks in the future.',
	link: 'http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_WorkingWithGroupsAndUsers.html',
	recommended_action: 'Remove unused groups without users',
	apis: ['IAM:listGroups', 'IAM:getGroup'],

	run: function(cache, includeSource, callback) {
		var results = [];
		var source = {};

		var region = 'us-east-1';

		var listGroups = (cache.iam &&
						  cache.iam.listGroups &&
						  cache.iam.listGroups[region]) ?
						  cache.iam.listGroups[region] : null;

		if (!listGroups) return callback(null, results, source);

		if (listGroups.err || !listGroups.data) {
			helpers.addResult(results, 3, 'Unable to query for groups');
			return callback(null, results, source);
		}

		if (!listGroups.data.length) {
			helpers.addResult(results, 0, 'No groups found');
			return callback(null, results, source);
		}
		
		async.each(data.Groups, function(group, cb){
			if (!group.GroupName) return cb();

			var getGroup = (cache.iam &&
						  	cache.iam.getGroup &&
						  	cache.iam.getGroup[region] &&
						  	cache.iam.getGroup[region][group.GroupName]) ?
						  	cache.iam.getGroup[region][group.GroupName] : null;

			if (!getGroup || getGroup.err || !getGroup.data || !getGroup.data.Users) {
				helpers.addResult(results, 3, 'Unable to query for group: ' + group.GroupName, 'global', group.Arn);
			} else if (!getGroup.data.Users.length) {
				helpers.addResult(results, 1, 'Group: ' + group.GroupName + ' does not contain any users', 'global', group.Arn);
				return cb();
			} else {
				helpers.addResult(results, 0, 'Group: ' + group.GroupName + ' contains ' + getGroup.data.Users.length + ' user(s)', 'global', group.Arn);
			}

			cb();
		}, function(){
			if (includeSource) {
				source = {
					listGroups: (cache.iam && cache.iam.listGroups) ?
								 cache.iam.listGroups : null,
					getGroup: (cache.iam && cache.iam.listGroups) ?
								 cache.iam.listGroups : null
				}
			}

			callback(null, results, source);
		});
	}
};