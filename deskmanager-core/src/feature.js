const FEATURE_FILE_NAME = 'feature.yml';

class FeatureService {
    logger;
    oswrapper;
    ymlParser;

    constructor(logger, oswrapper, ymlParser) {
        this.logger = logger;
        this.oswrapper = oswrapper;
        this.ymlParser = ymlParser;
    }

    convertFeature(declaration, featureName, featurePath) {
        const feature = declaration.feature;
        if (!feature) {
            return;
        }
        if (Array.isArray(feature)) {
            const declarations = feature;
            return { name: featureName, declarations, absPath: featurePath, };
        } else {
            const declarations = Object.keys(feature).map(name => ({ name, value: feature[name] }));
            return { name: featureName, declarations, absPath: featurePath, };
        }
    }

    async loadAllFeaturesByDir(dir) {
        const debug = this.logger.debug;
        const dirAsFile = await this.oswrapper.statFile(dir);

        const type = dirAsFile.type;

        if ('DIR' !== type) {
            throw `--feature-dir: [${dir}] is not a DIR, it is [${type}]`;
        }

        const features = (await Promise.all(dirAsFile.ext.map(async (fileName) => {
            const featureDirPath = await this.oswrapper.resolvePath(dir, fileName);
            const featureDirStat = await this.oswrapper.statFile(featureDirPath);

            debug(`[loadAllFeaturesByDir], dir: [${dir}], filename: [${fileName}], path: [${featureDirPath}], stat: [${featureDirStat}]`);

            if ('DIR' !== featureDirStat.type) {
                return;
            }

            if (!featureDirStat.ext.includes(FEATURE_FILE_NAME)) {
                return;
            }

            const featureFilePath = await this.oswrapper.resolvePath(featureDirPath, FEATURE_FILE_NAME)
            const featureFileStat = await this.oswrapper.statFile(featureFilePath);

            if ('FILE' !== featureFileStat.type) {
                return;
            }

            const featureAsString = await this.oswrapper.readFileAsString(featureFilePath);
            const declaration = this.ymlParser.parseStringAsYml(featureAsString);
            const feature = this.convertFeature(declaration, fileName, featureDirPath);

            if (undefined === feature) {
                throw `file [${featureFilePath}] is a valid yml file with wrong format. Root element should be a "feature"`;
            }

            return feature;
        }))).filter(it => undefined !== it);

        if (0 === features.length) {
            throw `--feature-dir: [${dir}] is a dir, but does not contain any dir with feature`
        }

        return features;
    }
}

module.exports = {
    createFeatureService(context) {
        return new FeatureService(context.logger, context.oswrapper, context.ymlParser);
    },
}
