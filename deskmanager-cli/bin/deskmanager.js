#!/usr/bin/env node

async function main(argv, env) {
    const main = require('../src/clirunner');
    await main.deskmanagerRun(argv, env);
}

main(process.argv, process.env);
