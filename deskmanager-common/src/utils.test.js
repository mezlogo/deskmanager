const { createUtils, } = require('./utils');

describe('test for [substituteVariable] function', () => {
    function createSut(dict) {
        return createUtils(dict);
    }

    test('when no regex pattern found should return string untouched', () => {
        const sut = createSut({});
        const actual = sut.substituteVariable('plain string');
        expect(actual).toBe('plain string');
    })

    test('when regex pattern found, but key does not found in regestry, should throw an error', () => {
        const sut = createSut({});
        expect(() => sut.substituteVariable('$A_KEY')).toThrow('Can not find a key: [$A_KEY] for substitution');
    })

    test('when reget patterns found should replace all occurance', () => {
        const sut = createSut({ sub1: 1, sub_2: 'sub', '__SUB__3': '' });
        const actual = sut.substituteVariable('sample string with $sub1 $sub_2 $__SUB__3 and $sub1 again');
        expect(actual).toBe('sample string with 1 sub  and 1 again');
    })
});
