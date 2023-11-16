const oswrapper = require('./oswrapper');
const { createUtils, } = require('./utils');
const { createOsWrapper, } = oswrapper;

function createLogger(verbose) {
    return {
      log(msg) { console.log(msg); },
      debug(msg) {
        if (verbose) {
          console.log('DEBUG: ' + msg);
        }
      },
    };
}

module.exports = { createOsWrapper, createLogger, createUtils, };
