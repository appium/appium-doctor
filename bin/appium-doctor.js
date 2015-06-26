// transpile:main

import Doctor from '../lib/doctor.js';
import yargs from 'yargs';

let argv = yargs.argv;

let opts = {};
for (let t of ['android', 'ios', 'dev']) {
  opts[t] = argv[t] ? true : false;
}

let doctor = new Doctor(opts);
doctor.runAll();
