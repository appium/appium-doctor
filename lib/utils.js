import B from 'bluebird';
import _fs from 'fs';
import _cp from 'child_process';
import path from 'path';

let pkgRoot = process.env.NO_PRECOMPILE ? path.resolve(__dirname, '..')
  : path.resolve(__dirname, '..', '..');

let cp = {
  exec: B.promisify(_cp.exec)
};

function isMac () {
  return process.platform === 'darwin';
}

let fs = {
  readFile: B.promisify(_fs.readFile),
  exists: B.promisify((f, cb) => {
    _fs.exists(f, function(res) { cb(null, res);});
  }),
};

export {pkgRoot, cp, isMac, fs};
