const BACKUP_SUFFIX = '.deskmngrbkp';
const GLOB_SUFFIX = '/*';

class ConfigHandler {
    order = 100;
    name = 'config';
    description = `Config handler creates links for config files:
    - it resolves environment variables with regexp by replacing each occure of word starting with '$' and captures everything after '[a-zA-Z0-9_]' like: '$HOME/.config'
    - it create links for both: file and dir
    - it can create link for each file in folder by using asteric. Path should ends with '/*' only, like: 'myConfigsInFeatureDir/*', not: 'myConfigsInFeatureDir/*.conf'
    - when a parent dir for link file is not writable for user it executes command with 'sudo' by spawn a new shell process, like: 'bash -c "sudo ln -s /etc/config $FEATURE_DIR/config"'
    - when a link file is already existed it will create a backup with following suffix: [${BACKUP_SUFFIX}]
    - both target file AND link's parent dir should be exist
    `;
    
    logger;
    oswrapper;
    utils;

    async init(context) {
        this.logger = context.logger;
        this.oswrapper = context.oswrapper;
        this.utils = context.utils;
    }

    /*
    Returns an array of parsed and validated (target AND parent of link should exist) declarations, where each entry contains of following fields:
    - target and link: fields with stat of target file. In terms of bash it looks like `ln -s $TARGET $LINK`
    - linkParent: a field for link's parent. It used for determine which os call to use based on 'canWrite' prop
    */
    async handleFeature(value) {
        const result = [];
        const featureName = value.featureName;
        const featurePath = value.featurePath;
        for (let config of value.declaration) {
            config =  {
                target: this.utils.substituteVariable(config.target),
                link: this.utils.substituteVariable(config.link),
            };

            const isGlob = config.target.endsWith(GLOB_SUFFIX);

            if (isGlob) {
                const targetWithoutSuffix = config.target.replace(GLOB_SUFFIX, '');
                const targetPath = await this.oswrapper.resolvePath(featurePath, targetWithoutSuffix);
                const targetStat = await this.oswrapper.statFile(targetPath);

                if ('DIR' !== targetStat.type) {
                    throw `for globbed feature: [${featureName}] at: [${featurePath}] target file: [${targetPath}] is not a dir: [${JSON.stringify(targetStat)}]`;
                }

                const linkPath = config.link;
                const linkStat = await this.oswrapper.statFile(linkPath);

                if ('DIR' !== linkStat.type) {
                    throw `for globbed feature: [${featureName}] at: [${featurePath}] link: [${linkPath}] is not a dir: [${JSON.stringify(linkStat)}]`;
                }

                const results = await Promise.all(targetStat.ext.map(async (fileName) => {
                    const targetFilePath = await this.oswrapper.resolvePath(targetPath, fileName);
                    const targetFileStat = await this.oswrapper.statFile(targetFilePath);
                    const linkFilePath = await this.oswrapper.resolvePath(linkPath, fileName);
                    const linkFileStat = await this.oswrapper.statFile(linkFilePath);
                    return { target: targetFileStat, link: linkFileStat, linkParent: linkStat, };
                }));

                results.forEach(it => result.push(it));
            } else {
                const targetPath = await this.oswrapper.resolvePath(featurePath, config.target);
                const targetStat = await this.oswrapper.statFile(targetPath);

                if ('NOT_EXIST' === targetStat.type) {
                    throw `for feature: [${featureName}] at: [${featurePath}] target file: [${targetPath}] is not exist`;
                }

                const linkPath = config.link;
                const linkParentPath = await this.oswrapper.resolvePath(linkPath, '..');
                const linkParentStat = await this.oswrapper.statFile(linkParentPath);

                if ('DIR' !== linkParentStat.type) {
                    throw `for feature: [${featureName}] at: [${featurePath}] parent of link: [${linkPath}] is not a dir: [${JSON.stringify(linkParentStat)}]`;
                }

                const linkStat = await this.oswrapper.statFile(linkPath);

                result.push({ target: targetStat, link: linkStat, linkParent: linkParentStat, });
            }
        }
        return result;
    }

    async diff(values) {
        const log = this.logger.log;

        for (const value of values) {
            log(`feature: [${value.featureName}]`);

            const parsedConfigs = await this.handleFeature(value);

            parsedConfigs.forEach(it => {
                const same = 'LINK' === it.link.type && it.link.ext.absPath === it.target.absPath;
                const useSudo = !it.linkParent.canWrite;
                const needBackup = 'NOT_EXIST' !== it.link.type;

                if (same) {
                    log(`file: [${it.target.absPath}] is already linked`);
                } else {
                    log(`file: [${it.target.absPath}] is not linked. needBackup: [${needBackup}], useSudo: [${useSudo}], link file type: [${it.link.type}]`)
                }
            });
        }
    }

    async install(values) {
        for (const value of values) {
            const parsedConfigs = await this.handleFeature(value);

            await Promise.all(parsedConfigs.map(async (it) => {
                const same = 'LINK' === it.link.type && it.link.ext.absPath === it.target.absPath;
                if (same) {
                    return Promise.resolve();
                }

                const useSudo = !it.linkParent.canWrite;
                const needBackup = 'NOT_EXIST' !== it.link.type;

                if (needBackup) {
                    const backupPath = it.link.absPath + BACKUP_SUFFIX;
                    if (useSudo) {
                        await this.oswrapper.sudoMoveFile(it.link.absPath, backupPath);
                    } else {
                        await this.oswrapper.moveFile(it.link.absPath, backupPath);
                    }
                }
                if (useSudo) {
                    await this.oswrapper.sudoLink(it.target.absPath, it.link.absPath);
                } else {
                    await this.oswrapper.link(it.target.absPath, it.link.absPath);
                }
            }));
        }
    }
}

module.exports = {
    createHandler() {
        return new ConfigHandler();
    },
}
