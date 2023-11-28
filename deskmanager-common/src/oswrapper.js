const { createOsFileWrapper, execshell, execfile, } = require('./files');

class OsWrapper {
    osFileWrapper;

    constructor(osFileWrapper) {
        this.osFileWrapper = osFileWrapper;
    }

    async resolvePath(parent, file) {
        return await this.osFileWrapper.resolvePath(parent, file);
    }

    async readFileAsString(path) {
        return await this.osFileWrapper.readFileUtf(path);
    }

    async writeFileAsString(path, content) {
        return await this.osFileWrapper.writeFileUtf(path, content);
    }

    async statFile(path) {
        return await this.osFileWrapper.parseFile(path);
    }

    async link(target, link) {
        return await this.osFileWrapper.link(target, link);
    }

    async sudoLink(target, link) {
        return await this.osFileWrapper.sudoLink(target, link);
    }

    async unlink(link) {
        return await this.osFileWrapper.unlink(link);
    }

    async sudoUnlink(link) {
        return await this.osFileWrapper.sudoUnlink(link);
    }

    async moveFile(from, to) {
        return await this.osFileWrapper.moveFile(from, to);
    }

    async sudoMoveFile(from, to) {
        return await this.osFileWrapper.sudoMoveFile(from, to);
    }

    execshell(prog, options) {
        return execshell(prog, options);
    }

    execfile(path, args, cwd) {
        return execfile(path, args, cwd);
    }
}

module.exports = {
    createOsWrapper(logger) {
        const osFileWrapper = createOsFileWrapper();
        return new OsWrapper(osFileWrapper);
    },
}
