// transpile:main

import yargs from 'yargs';
import _ from 'lodash';
import newDoctor from '../lib/factory';
import { configureBinaryLog } from '../lib/utils';

let opts = _.pick(yargs.argv, 'ios', 'android', 'dev', 'demo');
configureBinaryLog(opts);
newDoctor(opts).run();
