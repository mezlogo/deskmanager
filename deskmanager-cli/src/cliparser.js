/*
interface Options {
    command: CommandsEnum;
    featureDir?: string;
    handlerDir?: string;
    verbose: boolean;
    featureName: string;
}
*/

const { Command, } = require('commander');

function parseCliOptions(argv) {
    const program = new Command();

    program
        .passThroughOptions()
        // .enablePositionalOptions()
        .option('-v, --verbose', 'show verbose messages', false)
        .option('--feature-dir <dir>', 'features dir')
        .option('--feature-name <feature>', 'feature name inside features dir')
        .option('--handler-dir <dir>', 'handlers dir')
        // .option('-f, --feature <file...>', 'path to feature, could be file or directory')
        ;

    let command;

    program.command('diff').action(() => { command = 'diff'; });
    program.command('install').action(() => { command = 'install'; });
    program.command('uninstall').action(() => { command = 'uninstall'; });
    program.command('list-features').action(() => { command = 'list-features'; });
    program.command('list-handlers').action(() => { command = 'list-handlers'; });

    program.parse(argv);
    return { ...program.opts(), command, };
}

module.exports = { parseCliOptions, };
