const { performance } = require('perf_hooks');

async function deskmanagerCore(context, featureService, handlerService) {
    const logger = context.logger;
    const options = context.options;
    const command = options.command;

    if ('list-features' === command) {
        const featureDir = options.featureDir;

        if (!featureDir) {
            throw 'specify --feature-dir option'
        }

        const features = await featureService.loadAllFeaturesByDir(featureDir);

        features.forEach(feature => {
            logger.log(`feature name: [${feature.name}]`)
            feature.declarations.forEach(declare => logger.log(`\t${declare.name}: ${JSON.stringify(declare.value)}`));
        });

        return;
    }

    if ('list-handlers' === command) {
        const handlerDir = options.handlerDir;

        if (!handlerDir) {
            throw 'specify --handler-dir option';
        }

        const handlers = await handlerService.loadAllHandlersByDir(handlerDir);

        handlers.forEach(handler => {
            logger.log(`handler name: [${handler.name}] with order: [${handler.order}]`);
            logger.log(`description: ${handler.description}`);
        })

        return;
    }

    if (['diff', 'install', 'uninstall'].includes(command)) {
        const featureDir = options.featureDir;
        const featureName = options.featureName;
        const profileName = options.profileName;

        let targetFeatureNames;

        const bothArgsNull = (undefined == featureName && undefined == profileName);
        const bothArgsNotNull = (undefined != featureName && undefined != profileName);

        if (undefined == featureDir || bothArgsNull || bothArgsNotNull ) {
            throw 'specify --feature-dir either --feature-name or --profile-name options';
        }

        if (!!featureName) {
            targetFeatureNames = [featureName];
        } else {
            targetFeatureNames = await featureService.readProfile(featureDir, profileName);
        }

        const handlerDir = options.handlerDir;

        if (!handlerDir) {
            throw 'specify --handler-dir option';
        }

        const allFeatures = await featureService.loadAllFeaturesByDir(featureDir);

        const features = targetFeatureNames.map(targetFeatureName => {
            const foundFeature = allFeatures.find(it => it.name === targetFeatureName);
            if (!foundFeature) {
                throw `feature with name: [${featureName}] could not be found`;
            }
            return foundFeature;
        });

        const handlersNames = features.flatMap(it => it.declarations.flatMap(declaration => declaration.name));
        const uniqHandlersNames = [ ...new Set(handlersNames) ];

        const allHandlers = await handlerService.loadAllHandlersByDir(handlerDir);

        const handlers = uniqHandlersNames.map(handlerName => {
            const foundHandler = allHandlers.find(it => it.name === handlerName);
            if (!foundHandler) {
                throw `handler with name: [${handlerName}] could not be found`;
            }
            return foundHandler;
        })

        await Promise.all(handlers.map(handler => handler.init(context)));

        const handlersByName = handlers.reduce((acc, v) => { acc[v.name] = v; return acc; }, {});

        const featureDeclarations = features.flatMap(feature => {
            const featureName = feature.name;
            const featurePath = feature.absPath;
            return feature.declarations.map(declaration => {
                return {
                    featureName,
                    featurePath,
                    handlerName: declaration.name,
                    declaration: declaration.value,
                    order: declaration.order ?? handlers.find(handler => handler.name === declaration.name).order,
                };
            });
        });

        const byOrder = {};

        featureDeclarations.forEach(featureDeclaration => {
            const order = featureDeclaration.order;
            let handlersForGivenOrder = byOrder[order];

            if (!handlersForGivenOrder) {
                handlersForGivenOrder = {};
                byOrder[order] = handlersForGivenOrder;
            }

            const handlerName = featureDeclaration.handlerName;
            let declarationsForGivenHandler = handlersForGivenOrder[handlerName];
            
            if (!declarationsForGivenHandler) {
                declarationsForGivenHandler = [];
                handlersForGivenOrder[handlerName] = declarationsForGivenHandler;
            }

            declarationsForGivenHandler.push(featureDeclaration);
        })

        const ascending = (l, r) => l[0] - r[0];
        const descending = (l, r) => r[0] - l[0];
        const sortType = 'uninstall' === command ? descending : ascending;

        for (const [order, handlersForGivenOrder] of Object.entries(byOrder).sort(sortType)) {
            const startTimeOrderLevel = performance.now();
            logger.debug(`processing order: [${order}]`);

            for (const [handlerName, declarationsForGivenHandler] of Object.entries(handlersForGivenOrder)) {

                const startTimeHandlerLevel = performance.now();
                logger.debug(`processing order: [${order}] and handler: [${handlerName}]`);

                const handler = handlersByName[handlerName];
                await handler[command](declarationsForGivenHandler);

                logger.debug(`processing order: [${order}] and handler: [${handlerName}] ended. took: [${performance.now() - startTimeHandlerLevel}]`);
            }
            
            logger.debug(`processing order: [${order}] ended. took: [${performance.now() - startTimeOrderLevel}]`);
        }

        return;
    }

    throw `given command: [${command}] is not supported`;
}

module.exports = {
    deskmanagerCore,
}
