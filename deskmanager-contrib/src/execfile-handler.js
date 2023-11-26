class ExecfileHandler {
    order = 50;
    name = 'execfile';
    description = 'handler for executing files. Handlers sets cwd and passes command as an argument';
    
    logger;
    oswrapper;

    installed;

    async init(context) {
        this.logger = context.logger;
        this.oswrapper = context.oswrapper;
    }

    async handleFeature(value) {
        const result = await Promise.all(value.declaration.map(async (it) => {
            const cwd = value.featurePath;
            const fullpath = await this.oswrapper.resolvePath(cwd, it);
            return {
                featureName: value.featureName,
                cwd,
                fullpath,
            };
        }));
        return result;
    }

    async innerExec(values, command) {
        for (const value of values) {
            const results = await this.handleFeature(value);
            for (const it of results) {
                await this.oswrapper.execfile(it.fullpath, [command], it.cwd)
            }
        }
    }

    async diff(values) {
        await this.innerExec(values, 'diff');
    }

    async install(values) {
        await this.innerExec(values, 'install');
    }

    async uninstall(values) {
        await this.innerExec(values, 'uninstall');
    }
}

module.exports = {
    createHandler() {
        return new ExecfileHandler();
    },
}
