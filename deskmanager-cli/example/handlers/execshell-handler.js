class ExecShellHandler {
    order = 50;
    name = 'execshell';
    description = 'execute each string by passing to shell';

    logger;
    oswrapper;

    async init(context) {
        this.logger = context.logger;
        this.oswrapper = context.oswrapper;
    }

    async diff(values) {
        values.forEach(it => {
            const result = it.declaration;
            if ('string' === typeof result) {
                this.logger.log(`[execshell-handler][diff] will call shell with folloing line: [bash -c '${result}']`);
            } else {
                this.logger.log(`[execshell-handler][diff] value expected to be a string, but given: [${typeof result}] for feature: [${JSON.stringify(it)}]`);
            }
        });
    }
    
    async install(values) {
        for (const it of values) {
            const declaration = it.declaration;
            if ('string' === typeof declaration) {
                const result = await this.oswrapper.execshell(declaration);
                if (result.error) {
                    this.logger.log(`shell: [${declaration}] return error: [${result.error}] stderr: [${result.stderr}] stdout: [${result.stdout}]`);
                } else {
                    this.logger.log(`shell: [${declaration}] stdout:\n${result.stdout}`);
                }
            } else {
                this.logger.log(`[execshell-handler][install] value expected to be a string, but given: [${typeof declaration}] for feature: [${JSON.stringify(it)}]`);
            }
        };
    }
}

module.exports = {
    createHandler() {
        return new ExecShellHandler();
    },
}
