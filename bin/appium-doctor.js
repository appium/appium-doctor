// transpile:main

import yargs from 'yargs';
import _ from 'lodash';
import newDoctor from '../lib/factory';
import log from '../lib/logger';

let argv = yargs.argv;

// configuring log
log.unwrap().log = (level, prefix, message) => {
  console.log(message);
};
log.level = argv.debug ? 'debug' : 'info';

newDoctor(_.pick(argv, 'ios', 'android', 'dev', 'demo')).run();
