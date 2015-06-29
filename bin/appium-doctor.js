// transpile:main

import yargs from 'yargs';
import _ from 'lodash';
import newDoctor from '../lib/factory';

newDoctor(_.pick(yargs.argv, 'ios', 'android', 'dev')).run();

