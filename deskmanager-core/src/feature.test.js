const { createFeatureService, } = require('./feature');

describe('test for FeatureService class', () => {

    let statFile;
    let resolvePath;
    let readFileAsString;
    let writeFileAsString;
    let parseStringAsYml;

    beforeEach(() => {
        statFile = jest.fn();
        resolvePath = jest.fn();
        readFileAsString = jest.fn();
        writeFileAsString = jest.fn();
        parseStringAsYml = jest.fn();
    });

    function createSut() {
        const log = jest.fn();
        const debug = jest.fn();
        const context = {
            logger: { log, debug, },
            oswrapper: { statFile, resolvePath, readFileAsString, writeFileAsString, },
            options: {},
            ymlParser: { parseStringAsYml },
        };
        return createFeatureService(context);
    }

    describe('test for [writeProfile] function', () => {
        test('when profile file does not exist should throw an error', async () => {
            readFileAsString.mockRejectedValueOnce('no such file or directory');
            resolvePath.mockResolvedValueOnce('path');

            await expect(() => createSut().readProfile('/tmp', 'mytest.txt'))
                .rejects
                .toEqual('no such file or directory');

            expect(readFileAsString).toHaveBeenCalled();
        })

        test('when profile file is existed should return splited and sanitazed array of features', async () => {
            readFileAsString.mockResolvedValueOnce(` first-line \nsecond-line \n\n\n    `);
            resolvePath.mockResolvedValueOnce('path');

            const actuals = await createSut().readProfile('/tmp', 'mytest.txt');

            expect(actuals).toEqual(['first-line', 'second-line']);
        })
    })

    describe('test for [writeProfile] function', () => {
        test('when profile file could not be written should throw an error', async () => {
            writeFileAsString.mockRejectedValueOnce('no such file or directory');
            resolvePath.mockResolvedValueOnce('path');

            await expect(() => createSut().writeProfile('/tmp', 'mytest.txt', ['feature1', 'feature2']))
                .rejects
                .toEqual('no such file or directory');

            expect(writeFileAsString).toHaveBeenCalled();
        })

        test('when profile file could be written should pass to writeFileAsString features as string', async () => {
            writeFileAsString.mockResolvedValueOnce();
            resolvePath.mockResolvedValueOnce('path');

            await createSut().writeProfile('/tmp', 'mytest.txt', ['feature1', 'feature2']);

            expect(writeFileAsString.mock.calls[0][1]).toEqual('feature1\nfeature2');
        })
    })

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
