const { parseCliOptions, } = require('./cliparser');

const {
  createOsWrapper,
  createLogger,
  createUtils,
} = require('deskmanager-common');

const {
  createFeatureService,
  createHandlerService,
  createYmlParser,
  deskmanagerCore,
} = require('deskmanager-core');

function loadJsModule(path) {
  return require(path);
}

async function deskmanagerRun(argv, env) {
  // CLI ARGS PARSE
  const options = parseCliOptions(argv);

  // DI
  const logger = createLogger(options.verbose);

  const oswrapper = createOsWrapper(logger);

  const ymlParser = createYmlParser();

  const utils = createUtils(env);

  const context = {
    logger,
    oswrapper,
    ymlParser,
    options,
    loadJsModule,
    utils,
  };

  const featureService = createFeatureService(context)

  const handlerService = createHandlerService(context)

  // CALL
  await deskmanagerCore(context, featureService, handlerService);
}

module.exports = { deskmanagerRun, };
