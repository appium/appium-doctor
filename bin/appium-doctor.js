// transpile:main

import yargs from 'yargs';
import _ from 'lodash';
import newDoctor from '../lib/factory';
import log from '../lib/logger';

let argv = yargs.argv;

log.level = argv.debug ? 'debug' : 'info';

newDoctor(_.pick(argv, 'ios', 'android', 'dev')).run();
