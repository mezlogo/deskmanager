const HANDLER_MODULE_NAME_PATTER = '-handler.js';

class HandlerService {
    logger;
    oswrapper;
    loadJsModule;

    constructor(logger, oswrapper, loadJsModule) {
        this.logger = logger;
        this.oswrapper = oswrapper;
        this.loadJsModule = loadJsModule;
    }

    async loadAllHandlersByDir(dir) {
        const debug = this.logger.debug;
        const dirAsFile = await this.oswrapper.statFile(dir);

        const type = dirAsFile.type;

        if ('DIR' !== type) {
            throw `--handler-dir: [${dir}] is not a DIR, it is [${type}]`;
        }

        const handlers = (await Promise.all(dirAsFile.ext.map(async (fileName) => {
            const newFilePath = await this.oswrapper.resolvePath(dir, fileName);
            const newFileStat = await this.oswrapper.statFile(newFilePath);

            debug(`[loadAllHandlersByDir], dir: [${dir}], filename: [${fileName}], path: [${newFilePath}], stat: [${newFileStat}]`);

            if ('FILE' !== newFileStat.type) {
                return;
            }

            if (!fileName.endsWith(HANDLER_MODULE_NAME_PATTER)) {
                return;
            }

            const handlerModule = this.loadJsModule(newFilePath);
            const createHandler = handlerModule.createHandler;

            if (undefined === createHandler || 'function' !== typeof createHandler) {
                throw `module [${newFilePath}] should declare function with name [createHandler]`;
            }

            const handler = createHandler();

            if (!handler || !handler.name || !handler.order || !handler.description || !handler.diff) {
                throw `function [createHandler] from module [${newFilePath}] should return full spec handler (name, description, order, diff)`;
            }

            return handler;
        }))).filter(it => undefined !== it);

        if (0 === handlers.length) {
            throw `--handler-dir: [${dir}] is a dir, but does not contain any *-handler.js pattern file`;
        }

        return handlers;
    }
}

module.exports = {
    createHandlerService(context) {
        return new HandlerService(context.logger, context.oswrapper, context.loadJsModule);
    },
}
