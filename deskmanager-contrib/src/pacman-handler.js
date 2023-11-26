const READ_PROG = `pacman -Qq`;
const TEMPLATE = '$TEMPLATE'
const INSTALL_PROG_TEMPLATE = `pikaur -S --noedit ${TEMPLATE}`
const UNINSTALL_PROG_TEMPLATE = `sudo pacman -Rns ${TEMPLATE}`

class PacmanHandler {
    order = 10;
    name = 'pacman';
    description = 'handler for install archlinux pacman packages. For aur support uses pikaur';
    
    logger;
    oswrapper;

    installed;

    async init(context) {
        this.logger = context.logger;
        this.oswrapper = context.oswrapper;

        const { stdout, } = await this.oswrapper.execshell(READ_PROG, { capture: true });

        const result = stdout.split('\n').map(it => it.trim()).filter(it => '' !== it);
        this.installed = new Set(result);
    }

    handleFeatures(arrayOfDeclarations) {
        const declaredPackagesSet = new Set(arrayOfDeclarations.flat().map(it => it.trim()).filter(it => '' !== it));
        return [...declaredPackagesSet].map(it => ({ package: it, installed: this.installed.has(it)}));
    }

    async diff(values) {
        const log = this.logger.log;

        for (const value of values) {
            log(`feature: [${value.featureName}]`);
            const parsedPackages = this.handleFeatures(value.declaration);

            parsedPackages.forEach(it =>
                log(`[${ it.installed ? 'INSTALLED' : 'ABSENT   '}]: [${it.package}]`)
            );
        }
    }

    async install(values) {
        const log = this.logger.log;

        const parsedEntries = this.handleFeatures(values.map(it => it.declaration));
        const toModifyEntries = parsedEntries.filter(it => !it.installed).map(it => it.package);

        if (0 === toModifyEntries.length) {
            log('all packages are installed');
            return;
        }

        const joinedEntry = toModifyEntries.join(' ');
        const prog = INSTALL_PROG_TEMPLATE.replace(TEMPLATE, joinedEntry);
        const process = await this.oswrapper.execshell(prog, { capture: false });

        if (undefined != process.erorr) {
            throw `something goes wrong while calling next prog: [${prog}], process: [${process}]`;
        }

        log(`installed packages: [${joinedEntry}]`);
    }

    async uninstall(values) {
        const log = this.logger.log;

        const parsedEntries = this.handleFeatures(values.map(it => it.declaration));
        const toModifyEntries = parsedEntries.filter(it => it.installed).map(it => it.package);

        if (0 === toModifyEntries.length) {
            log('no packages to uninstall');
            return;
        }

        const joinedEntry = toModifyEntries.join(' ');
        const prog = UNINSTALL_PROG_TEMPLATE.replace(TEMPLATE, joinedEntry);
        const process = await this.oswrapper.execshell(prog, { capture: false });

        if (undefined != process.erorr) {
            throw `something goes wrong while calling next prog: [${prog}], process: [${process}]`;
        }

        log(`uninstalled packages: [${joinedEntry}]`);
    }
}

module.exports = {
    createHandler() {
        return new PacmanHandler();
    },
}
