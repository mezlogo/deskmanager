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

    if ('diff' === command || 'install' === command) {
        const featureDir = options.featureDir;
        const featureName = options.featureName;

        let targetFeatureNames;

        if (!featureDir || !featureName) {
            throw 'specify --feature-dir and --feature-name options';
        }

        if (!!featureName) {
            targetFeatureNames = [featureName];
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

        for (const handler of handlers.sort((l, r) => l.order - r.order)) {
            const handlerName = handler.name;
            const handlerArgs = features.map(feature => {
                const featureName = feature.name;
                const featurePath = feature.absPath;
                const declaration = feature.declarations.find(it => it.name === handlerName);
                return { featureName, featurePath, declaration: declaration?.value, };
            }).filter(it => !!it.declaration);
            logger.log(`start processing handler: [${handlerName}]`);
            await handler[command](handlerArgs);
        }

        return;
    }

    throw `given command: [${command}] is not supported`;
}

module.exports = {
    deskmanagerCore,
}
