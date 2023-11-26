const { performance } = require('perf_hooks');

const READ_SYSTEM_PROG = `systemctl list-unit-files --type=service --state=enabled --no-legend | awk '{print $1}'`;
const READ_USER_PROG = `systemctl list-unit-files --user --type=service --state=enabled --no-legend | awk '{print $1}'`;
const TEMPLATE = '$TEMPLATE';
const INSTALL_SYSTEM_PROG_TEMPLATE = `sudo systemctl enable ${TEMPLATE}`;
const INSTALL_USER_PROG_TEMPLATE = `systemctl --user enable ${TEMPLATE}`;
const UNINSTALL_SYSTEM_PROG_TEMPLATE = `sudo systemctl disable ${TEMPLATE}`;
const UNINSTALL_USER_PROG_TEMPLATE = `systemctl --user disable ${TEMPLATE}`;
const USER_PREFIX = 'user__';

class SystemdHandler {
    order = 70;
    name = 'systemd';
    description = `handler for enabling systemd services. --user supports by adding [${USER_PREFIX}]`;
    
    logger;
    oswrapper;

    systemServices;
    userServices;

    async init(context) {
        this.logger = context.logger;
        this.oswrapper = context.oswrapper;

        const systemResult = await this.oswrapper.execshell(READ_SYSTEM_PROG, { capture: true });
        const systemServices = systemResult.stdout.split('\n').map(it => it.trim()).filter(it => '' !== it);
        this.systemServices = new Set(systemServices);

        const userResult = await this.oswrapper.execshell(READ_USER_PROG, { capture: true });
        const userServices = userResult.stdout.split('\n').map(it => it.trim()).filter(it => '' !== it);
        this.userServices = new Set(userServices);
    }

    handleFeatures(declaration) {
        const declaredSet = new Set(declaration.flat().map(it => it.trim()).filter(it => '' !== it));
        return [...declaredSet].map(it => {
            const user = it.startsWith(USER_PREFIX);
            const service = user ? it.replace(USER_PREFIX, '') : it;
            return {
                service,
                user,
                enabled: (user ? this.userServices : this.systemServices).has(service)};
        });
    }

    async diff(values) {
        const log = this.logger.log;

        for (const value of values) {
            const parsed = this.handleFeatures(value.declaration);

            parsed.forEach(it =>
                log(`[${it.enabled ? 'ENABLED' : 'ABSENT '}] (${it.user ? 'USER  ' : 'SYSTEM'}): [${it.service}]`)
            );
        }
    }

    async install(values) {
        const log = this.logger.log;
        const debug = this.logger.debug;

        const parsed = this.handleFeatures(values.map(it => it.declaration));
        const notEnabled = parsed.filter(it => !it.enabled);

        if (0 === notEnabled.length) {
            log('all services are enabled');
            return;
        }

        for (const service of notEnabled) {
            const startAt = performance.now();
            const user = service.user;
            const prog = (user ? INSTALL_USER_PROG_TEMPLATE : INSTALL_SYSTEM_PROG_TEMPLATE).replace(TEMPLATE, service.service);

            debug(`will execute prog: [${prog}]`);
            const process = await this.oswrapper.execshell(prog, { capture: false });
            debug(`service: [${service.service}] enbaled. took: [${performance.now() - startAt}]`);
            if (undefined != process.erorr) {
                throw `something goes wrong while calling next prog: [${prog}], process: [${process}]`;
            }
        }

        log(`enbaled services: [${notEnabled.map(it => it.service).join(', ')}]`);
    }

    async uninstall(values) {
        const log = this.logger.log;
        const debug = this.logger.debug;

        const parsed = this.handleFeatures(values.map(it => it.declaration));
        const toModifyEntries = parsed.filter(it => it.enabled);

        if (0 === toModifyEntries.length) {
            log('all services are disabled');
            return;
        }

        for (const service of toModifyEntries) {
            const startAt = performance.now();
            const user = service.user;
            const prog = (user ? UNINSTALL_USER_PROG_TEMPLATE : UNINSTALL_SYSTEM_PROG_TEMPLATE).replace(TEMPLATE, service.service);

            debug(`will execute prog: [${prog}]`);
            const process = await this.oswrapper.execshell(prog, { capture: false });
            debug(`service: [${service.service}] disabled. took: [${performance.now() - startAt}]`);
            if (undefined != process.erorr) {
                throw `something goes wrong while calling next prog: [${prog}], process: [${process}]`;
            }
        }

        log(`disabled services: [${toModifyEntries.map(it => it.service).join(', ')}]`);
    }
}

module.exports = {
    createHandler() {
        return new SystemdHandler();
    },
}
