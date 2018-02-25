var helpers = require('../../helpers');
var unsupportedDomains = ['.uk', '.co.uk', '.me.uk', '.org.uk', '.jp', '.ru'];

module.exports = {
	title: 'Domain Transfer Lock',
	category: 'Route53',
	description: 'Ensures domains have the transfer lock set',
	more_info: 'To avoid having a domain maliciously transferred to a third-party, all domains should enable the transfer lock unless actively being transferred.',
	link: 'http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/domain-transfer-from-route-53.html',
	recommended_action: 'Enable the transfer lock for the domain',
	apis: ['Route53Domains:listDomains'],

	run: function(cache, settings, callback) {
		var results = [];
		var source = {};

		var region = 'us-east-1';

		var listDomains = helpers.addSource(cache, source,
			['route53domains', 'listDomains', region]);

		if (!listDomains) return callback(null, results, source);

		if (listDomains.err || !listDomains.data) {
			helpers.addResult(results, 3,
				'Unable to query for domains: ' + helpers.addError(listDomains));
			return callback(null, results, source);
		}

		if (!listDomains.data.length) {
			helpers.addResult(results, 0, 'No domains registered through Route53');
			return callback(null, results, source);
		}

		for (i in listDomains.data) {
			var domain = listDomains.data[i];

			// Skip domains that don't support transfer locks
			var skip = false;
			
			for (u in unsupportedDomains) {
				var uns = unsupportedDomains[u];

				if (domain.DomainName.indexOf(uns) === (domain.DomainName.length - uns.length)) {
					skip = true;
					break;
				}
			}

			if (skip) continue;

			if (domain.TransferLock) {
				helpers.addResult(results, 0,
					'Domain: ' + domain.DomainName + ' has the transfer lock enabled',
					'global', domain.DomainName);
			} else {
				helpers.addResult(results, 2,
					'Domain: ' + domain.DomainName + ' does not have the transfer lock enabled',
					'global', domain.DomainName);
			}
		}

		callback(null, results, source);
	}
};
