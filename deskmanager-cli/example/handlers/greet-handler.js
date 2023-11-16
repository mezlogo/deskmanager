class GreetHandler {
    order = 10;
    name = 'greet';
    description = 'greet each value';
    
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
                this.logger.log(`[greet-handler][diff] will print: [Hello, ${result}]`);
            } else {
                this.logger.log(`[greet-handler][diff] value expected to be a string, but given: [${typeof result}] for feature: [${JSON.stringify(it)}]`);
            }
        });
    }
    
    async install(values) {
        values.forEach(it => {
            const result = it.declaration;
            if ('string' === typeof result) {
                this.logger.log(`Hello, ${result}`);
            } else {
                this.logger.log(`[greet-handler][install] value expected to be a string, but given: [${typeof result}] for feature: [${JSON.stringify(it)}]`);
            }
        });
    }
}

module.exports = {
    createHandler() {
        return new GreetHandler();
    },
}
