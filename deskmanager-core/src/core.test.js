const { deskmanagerCore, } = require('./core');

describe('test for core function', () => {

    let log;

    let loadAllFeaturesByDir;

    let loadAllHandlersByDir;
    let loadHandlersByDirAndNames;

    beforeEach(() => {
        log = jest.fn();

        loadAllFeaturesByDir = jest.fn(async () => []);

        loadAllHandlersByDir = jest.fn(async () => []);
        loadHandlersByDirAndNames = jest.fn(async () => []);
    });

    async function callSut(options) {
        const context = { options, logger: { log, }, oswrapper: {}, };
        const featureService = { loadAllFeaturesByDir, };
        const handlersService = { loadAllHandlersByDir, loadHandlersByDirAndNames, };
        await deskmanagerCore(context, featureService, handlersService);
    }

    test('when passed not supported command should throw an exception', async () => {
        await expect(() => callSut({ command: 'not-supported-command' }))
            .rejects
            .toEqual('given command: [not-supported-command] is not supported');
    })

    describe('test for [list-features] command', () => {
        test('when --feature-dir option does not specified should throw an exception', async () => {
            await expect(() => callSut({ command: 'list-features' }))
                .rejects
                .toEqual('specify --feature-dir option');
        })

        test('when specified --feature-dir option should call featureService::loadAllFeaturesByDir', async () => {
            await callSut({ command: 'list-features', featureDir: '.' });
            expect(loadAllFeaturesByDir).toHaveBeenCalled();
        })

        test('when specified --feature-dir option should print all features', async () => {
            loadAllFeaturesByDir = jest.fn(async () => [{ name: 'samplefeature', declarations: [{ name: 'samplehandler1', value: 'hello, world' }] }]);
            await callSut({ command: 'list-features', featureDir: '.' });

            const loggedLines = log.mock.calls.map(it => it[0]);
            expect(loggedLines).toHaveLength(2);
            expect(loggedLines[0]).toBe('feature name: [samplefeature]');
            expect(loggedLines[1]).toBe('\tsamplehandler1: "hello, world"');
        })
    })

    describe('test for [list-handlers] command', () => {
        test('when --handler-dir option does not specify should throw an exception', async () => {
            await expect(() => callSut({ command: 'list-handlers' }))
                .rejects
                .toEqual('specify --handler-dir option');
        })

        test('when specified --handler-dir option should call handlerService::loadAllHandlersByDir', async () => {
            await callSut({ command: 'list-handlers', handlerDir: '.' });
            expect(loadAllHandlersByDir).toHaveBeenCalled();
        })

        test('when specified --handler-dir option should print all handlers', async () => {
            loadAllHandlersByDir = jest.fn(async () => [{ name: 'samplehandler1', order: 50, description: 'sample description' }]);
            await callSut({ command: 'list-handlers', handlerDir: '.' });

            const loggedLines = log.mock.calls.map(it => it[0]);
            expect(loggedLines).toHaveLength(2);
            expect(loggedLines[0]).toBe('handler name: [samplehandler1] with order: [50]');
            expect(loggedLines[1]).toBe('description: sample description');
        })
    })

    describe('test for [diff] command', () => {
        test('when given features with order field and handlers found should execute handlers in sorted order', async () => {
            const calledList = [];
            const handlerInit = jest.fn(() => Promise.resolve());
            const testh1DiffMock = jest.fn(() => calledList.push('testh1'));

            loadAllFeaturesByDir.mockReturnValueOnce(Promise.resolve([
                {
                    name: 'declaredfeature',
                    absPath: 'feature path',
                    declarations: [
                        { name: 'testh1', value: 'v1', order: 5 },
                        { name: 'testh1', value: 'v2', order: 5 },
                        { name: 'testh1', value: 'v3', order: 150 },
                        { name: 'testh1', value: 'v4'},
                    ]
                },
            ]));

            loadAllHandlersByDir.mockReturnValueOnce(Promise.resolve([
                { name: 'testh1', order: 50, description: 'test desc 1', diff: testh1DiffMock, init: handlerInit, },
            ]));

            await callSut({ command: 'diff', handlerDir: '.', featureDir: '.', featureName: 'declaredfeature' });

            expect(handlerInit).toHaveBeenCalled();
            expect(testh1DiffMock).toHaveBeenCalled();

            expect(testh1DiffMock.mock.calls[0][0]).toEqual([
                { featureName: 'declaredfeature', featurePath: 'feature path', declaration: 'v1', order: 5, handlerName: 'testh1' },
                { featureName: 'declaredfeature', featurePath: 'feature path', declaration: 'v2', order: 5, handlerName: 'testh1' },
            ]);

            expect(testh1DiffMock.mock.calls[1][0]).toEqual([
                { featureName: 'declaredfeature', featurePath: 'feature path', declaration: 'v4', order: 50, handlerName: 'testh1' },
            ]);
            expect(testh1DiffMock.mock.calls[2][0]).toEqual([
                { featureName: 'declaredfeature', featurePath: 'feature path', declaration: 'v3', order: 150, handlerName: 'testh1' },
            ]);

            expect(calledList).toEqual(['testh1', 'testh1', 'testh1']);
        })

        test('when given features and handlers found should execute handlers in sorted order', async () => {
            const calledList = [];
            const handlerInit = jest.fn(() => Promise.resolve());
            const testh1DiffMock = jest.fn(() => calledList.push('testh1'));
            const testh2DiffMock = jest.fn(() => calledList.push('testh2'));

            loadAllFeaturesByDir.mockReturnValueOnce(Promise.resolve([
                { name: 'declaredfeature', absPath: 'feature path', declarations: [{ name: 'testh1', value: 'v1'}, { name: 'testh2', value: 'v2'}] },
            ]));

            loadAllHandlersByDir.mockReturnValueOnce(Promise.resolve([
                { name: 'testh1', order: 50, description: 'test desc 1', diff: testh1DiffMock, init: handlerInit, },
                { name: 'testh2', order: 10, description: 'test desc 2', diff: testh2DiffMock, init: handlerInit, },
            ]));

            await callSut({ command: 'diff', handlerDir: '.', featureDir: '.', featureName: 'declaredfeature' });

            expect(handlerInit).toHaveBeenCalled();
            expect(testh1DiffMock).toHaveBeenCalled();
            expect(testh2DiffMock).toHaveBeenCalled();

            const testh2Args = testh2DiffMock.mock.calls[0][0];
            expect(testh2Args).toEqual([{ featureName: 'declaredfeature', featurePath: 'feature path', declaration: 'v2', order: 10, handlerName: 'testh2'}]);


            const testh1Args = testh1DiffMock.mock.calls[0][0];
            expect(testh1Args).toEqual([{ featureName: 'declaredfeature', featurePath: 'feature path', declaration: 'v1', order: 50, handlerName: 'testh1'}]);

            expect(calledList).toEqual(['testh2', 'testh1']);
        })

        test('when handler does not contain particular declared handler by feature should throw an exception', async () => {
            loadAllFeaturesByDir.mockReturnValueOnce(Promise.resolve([
                { name: 'declaredfeature', declarations: [{ name: 'testhandler', value: 'testvalue'}] },
            ]));

            loadAllHandlersByDir.mockReturnValueOnce(Promise.resolve([]));

            await expect(() => callSut({ command: 'diff', handlerDir: '.', featureDir: '.', featureName: 'declaredfeature' }))
                .rejects
                .toEqual('handler with name: [testhandler] could not be found');
        })

        test('when given feature could not be found in all feature should throw an exception', async () => {
            loadAllFeaturesByDir.mockReturnValueOnce(Promise.resolve([
                { name: 'declaredfeature', declarations: [] },
            ]));

            await expect(() => callSut({ command: 'diff', handlerDir: '.', featureDir: '.', featureName: 'notdeclaredfeature' }))
                .rejects
                .toEqual('feature with name: [notdeclaredfeature] could not be found');
        })
    })
});
