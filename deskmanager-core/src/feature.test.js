const { createFeatureService, } = require('./feature');

describe('test for FeatureService class', () => {

    let statFile;
    let resolvePath;
    let readFileAsString;
    let parseStringAsYml;

    beforeEach(() => {
        statFile = jest.fn();
        resolvePath = jest.fn();
        readFileAsString = jest.fn();
        parseStringAsYml = jest.fn();
    });

    function createSut() {
        const log = jest.fn();
        const debug = jest.fn();
        const context = {
            logger: { log, debug, },
            oswrapper: { statFile, resolvePath, readFileAsString, },
            options: {},
            ymlParser: { parseStringAsYml },
        };
        return createFeatureService(context);
    }

    describe('test for [loadAllFeaturesByDir] function', () => {
        test('when given featureDir is not a DIR should throw an exception', async () => {
            statFile = jest.fn(async () => ({ path: '.', type: 'NOT_EXIST', }));

            await expect(() => createSut().loadAllFeaturesByDir('anydir'))
                .rejects
                .toEqual('--feature-dir: [anydir] is not a DIR, it is [NOT_EXIST]');

            expect(statFile).toHaveBeenCalled();
        })

        test('when featureDir does not contain any real feature should throw an exception', async () => {
            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: [] }));

            await expect(() => createSut().loadAllFeaturesByDir('anydir'))
                .rejects
                .toEqual('--feature-dir: [anydir] is a dir, but does not contain any dir with feature');
        })

        test('when featureDir contains feature.yml with wrong inner format should throw an exception', async () => {
            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['feature1'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['feature.yml'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'FILE', }));
            
            resolvePath.mockImplementation(async () => 'not empty string');

            readFileAsString.mockReturnValueOnce(Promise.resolve('file content'))
            parseStringAsYml.mockReturnValueOnce({ wrong: 'format' });

            await expect(() => createSut().loadAllFeaturesByDir('anydir'))
                .rejects
                .toEqual('file [not empty string] is a valid yml file with wrong format. Root element should be a "feature"');
        })

        test('when featureDir contains features should parse them', async () => {
            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['feature1'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['feature.yml'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'FILE', }));
            
            resolvePath.mockImplementation(async () => 'not empty string');

            readFileAsString.mockReturnValueOnce(Promise.resolve('file content'))
            parseStringAsYml.mockReturnValueOnce({ feature: { testhandler: 'test value' }});

            const actuals = await createSut().loadAllFeaturesByDir('anydir');

            expect(actuals).toEqual([{ name: 'feature1', absPath: 'not empty string', declarations: [{ name: 'testhandler', value: 'test value' }]}]);
        })

        test('when featureDir contains feature in ARRAY format shuld parse them', async () => {
            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['feature1'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['feature.yml'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'FILE', }));
            
            resolvePath.mockImplementation(async () => 'not empty string');

            readFileAsString.mockReturnValueOnce(Promise.resolve('file content'))
            parseStringAsYml.mockReturnValueOnce({ feature: [ { name: 'testhandler', value: 'test value' }] });

            const actuals = await createSut().loadAllFeaturesByDir('anydir');

            expect(actuals).toEqual([{ name: 'feature1', absPath: 'not empty string', declarations: [{ name: 'testhandler', value: 'test value' }]}]);
        })
    })

});
