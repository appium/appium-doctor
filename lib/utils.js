import B from 'bluebird';
import path from 'path';
import _inquirer from 'inquirer';
import log from '../lib/logger';
import authorize from 'authorize-ios';
import { fs } from 'appium-support';

// rename to make more sense
const authorizeIos = authorize;

const pkgRoot = process.env.NO_PRECOMPILE ?
  path.resolve(__dirname, '..') : path.resolve(__dirname, '..', '..');

const ok = (message) => { return {ok: true, optional: false, message}; };
const nok = (message) => { return {ok: false, optional: false, message}; };
const okOptional = (message) => { return {ok: true, optional: true, message}; };
const nokOptional = (message) => { return {ok: false, optional: true, message}; };

const inquirer = {
  prompt: B.promisify(function (question, cb) { // eslint-disable-line promise/prefer-await-to-callbacks
    _inquirer.prompt(question, function (resp) { cb(null, resp); }); // eslint-disable-line promise/prefer-await-to-callbacks
  })
};

function configureBinaryLog (opts) {
  let actualLog = log.unwrap().log;
  log.unwrap().log = function (level, prefix, msg) {
    let l = this.levels[level];
    if (l < this.levels[this.level]) return; // eslint-disable-line curly
    actualLog(level, prefix, msg);
  };
  log.level = opts.debug ? 'debug' : 'info';
}

/**
 * Return an executable path of cmd
 *
 * @param {string} cmd Standard output by command
 * @return {?string} The full path of cmd. `null` if the cmd is not found.
 */
async function resolveExecutablePath (cmd) {
  let executablePath;
  try {
    executablePath = await fs.which(cmd);
    if (executablePath && await fs.exists(executablePath)) {
      return executablePath;
    }
  } catch (err) {
    if ((/not found/gi).test(err.message)) {
      log.debug(err);
    } else {
      log.warn(err);
    }
  }
  log.debug(`No executable path of '${cmd}'.`);
  if (executablePath) {
    log.debug(`Does '${executablePath}' exist?`);
  }
  return null;
}

export { pkgRoot, ok, nok, okOptional, nokOptional, inquirer, configureBinaryLog, authorizeIos, resolveExecutablePath};
