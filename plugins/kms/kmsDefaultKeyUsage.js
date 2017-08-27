var async = require('async');
var helpers = require('../../helpers');

module.exports = {
	title: 'KMS Default Key Usage',
	category: 'KMS',
	description: 'Checks various services to ensure the default KMS key is not being used.',
	more_info: 'It is recommended not to use the default key to avoid encrypting disparate sets of data with the same key. Each application should have its own customer-managed KMS key.',
	recommended_action: 'Avoid using the default KMS key.',
	link: 'http://docs.aws.amazon.com/kms/latest/developerguide/concepts.html',
	apis: ['KMS:listKeys', 'KMS:describeKey', 'KMS:getKeyRotationStatus'],

	run: function(cache, callback) {
		var results = [];
		var source = {};

		async.each(helpers.regions.kms, function(region, rcb){
			
			var listKeys = helpers.addSource(cache, source,
					['kms', 'listKeys', region]);

			if (!listKeys) return rcb();

			if (listKeys.err || !listKeys.data) {
				helpers.addResult(results, 3,
					'Unable to list KMS keys: ' + helpers.addError(listKeys), region);
				return rcb();
			}

			if (!listKeys.data.length) {
				helpers.addResult(results, 0, 'No KMS keys found', region);
				return rcb();				
			}

			async.each(listKeys.data, function(kmsKey, kcb){
				var describeKey = helpers.addSource(cache, source,
					['kms', 'describeKey', region, kmsKey.KeyId]);

				var getKeyRotationStatus = helpers.addSource(cache, source,
					['kms', 'getKeyRotationStatus', region, kmsKey.KeyId]);

				if (!describeKey || describeKey.err || !describeKey.data) {
					helpers.addResult(results, 3,
						'Unable to describe key: ' + helpers.addError(describeKey),
						region, kmsKey.KeyArn);
					return kcb();
				}

				var describeKeyData = describeKey.data;

				// AWS-generated keys for CodeCommit, ACM, etc. should be skipped.
				// The only way to distinguish these keys is the default description used by AWS.
				// Also skip keys that are being deleted
				if (describeKeyData.KeyMetadata &&
					(describeKeyData.KeyMetadata.Description && describeKeyData.KeyMetadata.Description.indexOf('Default master key that protects my') === 0) ||
					(describeKeyData.KeyMetadata.KeyState && describeKeyData.KeyMetadata.KeyState == 'PendingDeletion')) {
					return kcb();
				}

				var keyRotationStatusData = getKeyRotationStatus.data;

				if (!getKeyRotationStatus || getKeyRotationStatus.err || !getKeyRotationStatus.data) {
					helpers.addResult(results, 3,
						'Unable to get key rotation status: ' + helpers.addError(getKeyRotationStatus),
						region, kmsKey.KeyArn);
					return kcb();
				}

				if (keyRotationStatusData.KeyRotationEnabled) {
					helpers.addResult(results, 0, 'Key rotation is enabled', region, kmsKey.KeyArn);
				} else {
					helpers.addResult(results, 2, 'Key rotation is not enabled', region, kmsKey.KeyArn);
				}

				kcb();
			}, function(){
				rcb();
			});
		}, function(){
			callback(null, results, source);
		});
	}
};