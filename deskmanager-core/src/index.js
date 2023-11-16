const { createYmlParser, } = require('./ymlparser');
const { createHandlerService, } = require('./handler');
const { createFeatureService, } = require('./feature');
const { deskmanagerCore, } = require('./core');

module.exports = { createYmlParser, createHandlerService, createFeatureService, deskmanagerCore, };
