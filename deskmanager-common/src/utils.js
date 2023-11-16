class DeskManagerUtils {
    envRegex = /\$[a-zA-Z0-9_]+/g;

    constructor(dict) {
        const modifiedDict = Object.entries(dict).map(([k, v]) => ['$' + k, v]);
        this.envByName = Object.fromEntries(modifiedDict);
        const regexSubstitution = modifiedDict.map(([k, v]) => [k, new RegExp('\\' + k, 'g')]);
        this.regByName = Object.fromEntries(regexSubstitution); 
    }

    substituteVariable(text) {
        const foundEnvs = text.match(this.envRegex);
        if (!foundEnvs) {
            return text;
        }
        let result = text;
        foundEnvs.forEach(it => {
            const sub = this.envByName[it];
            const reg = this.regByName[it];
            if (undefined == sub || undefined == reg) {
                throw `Can not find a key: [${it}] for substitution`;
            }
            result = result.replace(reg, sub);
        })
        return result;
    }
}

module.exports = {
    createUtils(dict) {
        return new DeskManagerUtils(dict);
    }
}
