const { createHandler, } = require('./config-handler');

const lastDir = /\/[a-zA-Z0-9_.]+$/;

function fakeResolvePath(dir, filename) {
    if ('..' === filename) {
        return dir.replace(lastDir, '');
    }
    if (filename.endsWith('/*')) {
        filename = filename.replace('/*', '');
    }
    return dir + '/' + filename;
}

const feature = {
    featureName: 'test not globbed feature name',
    featurePath: '/test/feature/path/not_globbed',
    declaration: [
        { link: '$TEST_LINK/path_to_link', target: 'feature/path/config', },
    ],
};

const featureTargetPath = fakeResolvePath(feature.featurePath, feature.declaration[0].target);
const featureLinkPath = feature.declaration[0].link;
const featureLinkParentPath = fakeResolvePath(feature.declaration[0].link, '..');

const featureGlob = {
    featureName: 'test globbed feature name',
    featurePath: '/test/feature/path/globbed',
    declaration: [
        { link: '$TEST_LINK/config_dir', target: 'feature/path/configs/*', },
    ],
};

const featureGlobbedTargetPath = fakeResolvePath(featureGlob.featurePath, featureGlob.declaration[0].target);
const featureGlobbedLinkPath = featureGlob.declaration[0].link;

const aFilenameInsideDir = 'some_text_file.txt';
const aFile = { absPath: '/abs/path/to/file', canRead: true, canWrite: true, type: 'FILE', };
const aNotFound = { absPath: '/abs/path/to/not_found_file', canRead: false, canWrite: false, type: 'NOT_EXIST', };
const aDir = { absPath: '/abs/path/to/dir', canRead: true, canWrite: true, type: 'DIR', ext: [aFilenameInsideDir] };
const aLink = { absPath: '/abs/path/to/link', canRead: true, canWrite: true, type: 'LINK', ext: aFile };

describe('test for [config-handler] class', () => {
    let log;
    let debug;

    let statFile;
    let resolvePath;
    let moveFile;
    let sudoMoveFile;
    let link;
    let sudoLink;
 
    let substituteVariable;

    beforeEach(() => {
        log = jest.fn();
        debug = jest.fn();

        statFile = jest.fn();
        resolvePath = jest.fn(async (dir, filename) => fakeResolvePath(dir, filename));
        moveFile = jest.fn();
        sudoMoveFile = jest.fn();
        link = jest.fn();
        sudoLink = jest.fn();

        substituteVariable = jest.fn(it => it);
    });

    async function creaetSut() {
        const handler = createHandler();
        await handler.init({
            oswrapper: { statFile, resolvePath, moveFile, sudoMoveFile, link, sudoLink, },
            logger: { log, debug, },
            utils: { substituteVariable, },
        });
        return handler;
    }

    function configStatFile(regestry) {
        statFile.mockImplementation(path => {
            const result = regestry[path];
            if (undefined == result) {
                throw `TEST ERROR, unsupported path: [${path}]`;
            }
            return Promise.resolve(result);
        });
    }

    describe('test for [handleFeature] method', () => {

        async function callSut(feature) {
            const sut = await creaetSut();
            return await sut.handleFeature(feature);
        }

        describe('test for not globbed config', () => {
            test('when target file is not exist should throw an error', async () => {
                const regestry = {
                    [featureTargetPath]: aNotFound,
                };
                configStatFile(regestry);

                await expect(() => callSut(feature))
                    .rejects
                    .toEqual("for feature: [test not globbed feature name] at: [/test/feature/path/not_globbed] target file: [/test/feature/path/not_globbed/feature/path/config] is not exist");

                Object.keys(regestry).forEach(it => expect(statFile).toHaveBeenCalledWith(it));
            })

            test('when parent of link is not a dir should throw an error', async () => {
                const regestry = {
                    [featureTargetPath]: aFile,
                    [featureLinkParentPath]: aNotFound,
                };
                configStatFile(regestry);

                await expect(() => callSut(feature))
                    .rejects
                    .toEqual('for feature: [test not globbed feature name] at: [/test/feature/path/not_globbed] parent of link: [$TEST_LINK/path_to_link] is not a dir: [{"absPath":"/abs/path/to/not_found_file","canRead":false,"canWrite":false,"type":"NOT_EXIST"}]');

                Object.keys(regestry).forEach(it => expect(statFile).toHaveBeenCalledWith(it));
            })

            test('when target file, link file and link parent dir exists should return everything as expected', async () => {
                const regestry = {
                    [featureTargetPath]: aFile,
                    [featureLinkParentPath]: aDir,
                    [featureLinkPath]: aFile,
                };
                configStatFile(regestry);

                const actual = await callSut(feature);

                expect(actual).toEqual([{ target: aFile, linkParent: aDir, link: aFile}]);
            })
        })

        describe('test for globbed config', () => {
            test('when globbed target is not a dir should thrown an error', async () => {
                const regestry = {
                    [featureGlobbedTargetPath]: aFile,
                };
                configStatFile(regestry);

                await expect(() => callSut(featureGlob))
                    .rejects
                    .toEqual('for globbed feature: [test globbed feature name] at: [/test/feature/path/globbed] target file: [/test/feature/path/globbed/feature/path/configs] is not a dir: [{"absPath":"/abs/path/to/file","canRead":true,"canWrite":true,"type":"FILE"}]');

                Object.keys(regestry).forEach(it => expect(statFile).toHaveBeenCalledWith(it));
            })

            test('when globbed target is a dir, but link is not should thrown an error', async () => {
                const regestry = {
                    [featureGlobbedTargetPath]: aDir,
                    [featureGlobbedLinkPath]: aFile,
                };
                configStatFile(regestry);

                await expect(() => callSut(featureGlob))
                    .rejects
                    .toEqual('for globbed feature: [test globbed feature name] at: [/test/feature/path/globbed] link: [$TEST_LINK/config_dir] is not a dir: [{"absPath":"/abs/path/to/file","canRead":true,"canWrite":true,"type":"FILE"}]');

                Object.keys(regestry).forEach(it => expect(statFile).toHaveBeenCalledWith(it));
            })

            test('when globbed target dir, link dir and everything inside exists should return everything as expected', async () => {
                const fileInsideTarget = fakeResolvePath(featureGlobbedTargetPath, aFilenameInsideDir);
                const fileInsideLink = fakeResolvePath(featureGlobbedLinkPath, aFilenameInsideDir);
                const regestry = {
                    [featureGlobbedTargetPath]: aDir,
                    [featureGlobbedLinkPath]: aDir,
                    [fileInsideTarget]: aFile,
                    [fileInsideLink]: aNotFound,
                };
                configStatFile(regestry);
                statFile.mockResolvedValueOnce(aDir)
                    .mockResolvedValueOnce(aDir)
                    .mockResolvedValueOnce(aFile)
                    .mockResolvedValueOnce(aNotFound);

                const actual = await callSut(featureGlob);

                expect(actual).toEqual([{ target: aFile, linkParent: aDir, link: aNotFound, }]);

                Object.keys(regestry).forEach(it => expect(statFile).toHaveBeenCalledWith(it));
            })
        })
    })

    describe('test for [install] method', () => {
        let handleFeature;

        beforeEach(() => {
            handleFeature = jest.fn();
        })

        async function callSut(feature) {
            const sut = await creaetSut();
            sut.handleFeature = handleFeature;
            return await sut.install([feature]);
        }

        test('when link path is existed should create backup file and create link calling move (canWrite: true)', async () => {
            handleFeature.mockResolvedValueOnce([{ target: aFile, link: aFile, linkParent: aDir }]);

            await callSut(feature);

            expect(moveFile).toHaveBeenCalled();
            expect(link).toHaveBeenCalled();
        })

        test('when link path is existed should create backup file and create link calling move (canWrite: false)', async () => {
            handleFeature.mockResolvedValueOnce([{ target: aFile, link: aFile, linkParent: {...aDir, canWrite: false } }]);

            await callSut(feature);

            expect(sudoMoveFile).toHaveBeenCalled();
            expect(sudoLink).toHaveBeenCalled();
        })

        test('when link path is existed and already linked to target should neither create backup file nor create link calling move (canWrite: true)', async () => {
            handleFeature.mockResolvedValueOnce([{ target: aFile, link: aLink, linkParent: aDir }]);

            await callSut(feature);

            expect(sudoMoveFile).not.toHaveBeenCalled();
            expect(sudoLink).not.toHaveBeenCalled();
            expect(moveFile).not.toHaveBeenCalled();
            expect(link).not.toHaveBeenCalled();
        })
    })
})
