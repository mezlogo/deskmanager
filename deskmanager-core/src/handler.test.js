const { createHandlerService, } = require('./handler');

describe('test for HandlerClass class', () => {

    let statFile;
    let resolvePath;
    let readFileAsString;
    let loadJsModule;

    beforeEach(() => {
        statFile = jest.fn();
        resolvePath = jest.fn();
        readFileAsString = jest.fn();
        loadJsModule = jest.fn();
    });

    function createSut() {
        const log = jest.fn();
        const debug = jest.fn();
        const context = {
            logger: { log, debug, },
            oswrapper: { statFile, resolvePath, readFileAsString, },
            options: {},
            loadJsModule,
        };
        return createHandlerService(context);
    }

    describe('test for [loadAllHandlersByDir] function', () => {
        test('when given handlerDir is not a DIR should throw an exception', async () => {
            statFile = jest.fn(async () => ({ path: '.', type: 'NOT_EXIST', }));

            await expect(() => createSut().loadAllHandlersByDir('anydir'))
                .rejects
                .toEqual('--handler-dir: [anydir] is not a DIR, it is [NOT_EXIST]');

            expect(statFile).toHaveBeenCalled();
        })

        test('when handlerDir does not contain any real handler should throw an exception', async () => {
            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['somedir'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: []}));

            await expect(() => createSut().loadAllHandlersByDir('anydir'))
                .rejects
                .toEqual('--handler-dir: [anydir] is a dir, but does not contain any *-handler.js pattern file');
        })

        test('when handlerDir contains test-handler.js with wrong inner format should throw an exception', async () => {
            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['test-handler.js'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'FILE', }));
            
            resolvePath.mockImplementation(async () => 'not empty string');
            loadJsModule.mockReturnValueOnce({ wrong: 'format' });

            await expect(() => createSut().loadAllHandlersByDir('anydir'))
                .rejects
                .toEqual('module [not empty string] should declare function with name [createHandler]');
        })

        test('when handlerDir contains correct test-handler.js should create one', async () => {
            const createHandler = jest.fn();
            const stubbedHandler = { name: 'test-handler', description: 'test description', order: 50, diff: jest.fn(), };
            createHandler.mockReturnValueOnce(stubbedHandler)

            statFile.mockReturnValueOnce(Promise.resolve({ path: '.', type: 'DIR', ext: ['test-handler.js'] }))
                .mockReturnValueOnce(Promise.resolve({ path: '.', type: 'FILE', }));
            
            resolvePath.mockImplementation(async () => 'not empty string');
            loadJsModule.mockReturnValueOnce({ createHandler });

            const actuals = await createSut().loadAllHandlersByDir('anydir');

            expect(actuals).toEqual([stubbedHandler]);
        })
    })

});
