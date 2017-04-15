module.exports = {
	cache: require('./cache.js'),
	functions: require('./functions.js'),
	regions: require('./regions.js'),
	addResults: require('./functions.js').addResults,

	MAX_REGIONS_AT_A_TIME: 4
};