import B from 'bluebird';
import _fs from 'fs';
import _cp from 'child_process';
import path from 'path';

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

export {pkgRoot, cp, fs, isMac, macOsxVersion, ok, nok};
