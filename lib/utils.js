import B from 'bluebird';
import _fs from 'fs';
import _cp from 'child_process';
import path from 'path';
import _inquirer from 'inquirer';

let pkgRoot = process.env.NO_PRECOMPILE ?
  path.resolve(__dirname, '..') : path.resolve(__dirname, '..', '..');

let cp = {
  exec: B.promisify(_cp.exec)
};

let fs = {
  readFile: B.promisify(_fs.readFile),
  exists: B.promisify((f, cb) => {
    _fs.exists(f, function (res) { cb(null, res);});
  }),
  lstat: B.promisify(_fs.lstat)
};

function isMac () {
  return process.platform === 'darwin';
}

async function macOsxVersion () {
  let stdout;
  try {
    [stdout] = await cp.exec("sw_vers -productVersion");
  } catch (err) {
    throw new Error("Unknown SW Version Command: " + err);
  }
  for (let v of ['10.8', '10.9', '10.10']) {
    if (stdout.indexOf(v) === 0) { return v; }
  }
  throw new Error("Could not detect Mac OS X Version");
}

let ok = (message) => { return {ok: true, message: message }; };
let nok = (message) => { return {ok: false, message: message }; };

let inquirer = {
  prompt: B.promisify(function(question, cb) {
    _inquirer.prompt(question, function(resp) { cb(null, resp); });
  })
};

async function authorizeIos () {
  try {
    var authorizePath = path.resolve(__dirname, "../../bin", "authorize-ios.js");
    await cp.exec(`'${process.execPath}' '${authorizePath}'`, { maxBuffer: 524288});
  } catch (err) {
    throw new Error('Could not authorize iOS: ' + err);
  }
}

export { pkgRoot, cp, fs, isMac, macOsxVersion, ok, nok, inquirer, authorizeIos };
