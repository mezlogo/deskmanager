const fs = require('fs');
const path = require('path');
const os = require('os');

const { createOsFileWrapper, } = require('./files');

describe('test for [parseFile] function', () => {
    const sut = createOsFileWrapper();
    let tmpdir;

    beforeAll(() => {
        tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskmanagertest-'));
    });


    afterAll(() => {
        fs.rmSync(tmpdir, { recursive: true, force: true });
    });

    test('parse NOT_EXIST file', async () => {

        const fileName = 'this_file_should_not_be_exist';
        const absPath = path.join(tmpdir, fileName);

        const actual = await sut.parseFile(absPath);

        expect(actual.type).toBe('NOT_EXIST');
        expect(actual.absPath).toBe(absPath);
        expect(actual.canRead).toBe(false);
        expect(actual.canWrite).toBe(false);
    })

    test('parse FILE', async () => {
        const fileName = 'hello.txt';
        const absPath = path.join(tmpdir, fileName);

        fs.writeFileSync(absPath, 'hello');

        const actual = await sut.parseFile(absPath);

        expect(actual.type).toBe('FILE');
        expect(actual.absPath).toBe(absPath);
        expect(actual.canRead).toBe(true);
        expect(actual.canWrite).toBe(true);
    })

    test('parse DIR', async () => {
        const parentDirPath = `${tmpdir}/dirtest`;
        fs.mkdirSync(parentDirPath);
        fs.mkdirSync(`${parentDirPath}/dir1`);
        fs.closeSync(fs.openSync(`${parentDirPath}/file1`, 'w'));

        const actual = await sut.parseFile(parentDirPath);

        expect(actual.type).toBe('DIR');
        expect(actual.absPath).toBe(parentDirPath);
        expect(actual.ext).toEqual(['dir1', 'file1']);
        expect(actual.canRead).toBe(true);
        expect(actual.canWrite).toBe(true);
    })

    test('parse LINK', async () => {
        const fileName = 'original.txt';
        const linkFileName = 'link.txt';

        const absPath = path.join(tmpdir, fileName);
        const linkAbsPath = path.join(tmpdir, linkFileName);

        fs.closeSync(fs.openSync(absPath, 'w'));
        fs.symlinkSync(absPath, linkAbsPath);

        const actual = await sut.parseFile(linkAbsPath);

        expect(actual.type).toBe('LINK');
        expect(actual.absPath).toBe(linkAbsPath);
        expect(actual.ext).toEqual({ type: 'FILE', absPath: absPath, canRead: true, canWrite: true })
        expect(actual.canRead).toBe(true);
        expect(actual.canWrite).toBe(true);
    })
});
