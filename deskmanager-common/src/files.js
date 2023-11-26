const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const { exec, spawn, } = require('child_process');

function spawnShellInherit(prog) {
    return new Promise((resolve, reject) => {
        const spawnProcess = spawn(prog, { stdio: 'inherit', shell: true });
        spawnProcess.on('close', code => {
            if (0 === code) {
                resolve({});
            } else {
                reject({ error: code });
            }
        });
    });
}

function execshell(prog, options) {
    if (options.capture) {
        return new Promise((resolve, reject) => {
            exec(prog, (error, stdout, stderr) => {
                if (error) {
                    reject({ error, stdout, stderr, });
                } else {
                    resolve({ error, stdout, stderr, });
                }
            })
        });
    } else {
        return spawnShellInherit(prog);
    }
}

function execfile(path, args, cwd) {
    return new Promise((resolve, reject) => {
        const spawnProcess = spawn(path, args, { stdio: 'inherit', cwd });
        spawnProcess.on('close', code => {
            if (0 === code) {
                resolve({});
            } else {
                reject({ error: code });
            }
        });
    });
}

class OsFileWrapper {
    async resolvePath(parent, file) {
        return path.resolve(parent, file);
    }

    async fsAccess(path, constant) {
        try {
            await fs.access(path, constant);
            return true;
        } catch (err) {
            return false;
        }
    }

    async link(target, link) {
        return await fs.symlink(target, link);
    }

    async sudoLink(target, link) {
        const prog = `sudo ln -s ${target} ${link}`;
        const result = await execshell(prog, { capture: true });
        if (undefined != result.error) {
            throw `prog: [${prog}] exit with error code. result: [${result}]`;
        }
    }

    async unlink(link) {
        return await fs.unlink(link);
    }

    async sudoUnlink(link) {
        const prog = `sudo unlink ${link}`;
        const result = await execshell(prog, { capture: true });
        if (undefined != result.error) {
            throw `prog: [${prog}] exit with error code. result: [${result}]`;
        }
    }

    async moveFile(from, to) {
        return await fs.rename(from, to);
    }

    async sudoMoveFile(from, to) {
        const prog = `sudo mv ${from} ${to}`;
        const result = await execshell(prog, { capture: true });
        if (undefined != result.error) {
            throw `prog: [${prog}] exit with error code. result: [${result}]`;
        }
    }

    async parseFile(path) {
        const result = {
            absPath: path,
            type: 'NOT_EXIST',
            canRead: false,
            canWrite: false,
        };

        let fileStat;
        try {
            fileStat = await fs.lstat(path);
        } catch (err) {
            return result;
        }

        result.canRead = await this.fsAccess(path, constants.R_OK);
        result.canWrite = await this.fsAccess(path, constants.W_OK);

        if (fileStat.isDirectory()) {
            result.type = 'DIR';
            result.ext = await fs.readdir(path);
        } else if (fileStat.isFile()) {
            result.type = 'FILE';
        } else if (fileStat.isSymbolicLink()) {
            result.type = 'LINK';
            const linkPath = await fs.readlink(path);
            result.ext = await this.parseFile(linkPath);
        }

        return result;
    }

    async readFileUtf(path) {
        return await fs.readFile(path, 'utf8');
    }
}

module.exports = {
    execshell,
    execfile,
    createOsFileWrapper() {
        return new OsFileWrapper();
    },
};
