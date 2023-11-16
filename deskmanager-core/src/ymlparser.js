const { load, } = require('js-yaml');

class YmlParser {
    parseStringAsYml(stringAsYml) {
        return load(stringAsYml);
    }
};

module.exports = {
    createYmlParser(context) {
        return new YmlParser();
    }
}
