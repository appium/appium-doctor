import _ from 'lodash';
import { Doctor } from './doctor.js';
import iosChecks from './ios';
import androidChecks from './android';
import devChecks from './dev';

let checks = { iosChecks, androidChecks, devChecks };

let newDoctor = (opts) => {
  if (!opts.ios && !opts.android) {
    _.merge( opts, {ios: true, android: true});
  }
  let doctor = new Doctor();
  for (let k of _.keys(opts)) {
    doctor.register(checks[`${k}Checks`] || []);
  }
  return doctor;
};

export default newDoctor;
