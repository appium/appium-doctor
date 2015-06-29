import { Doctor } from '../lib/doctor.js';
import iosChecks from './ios';

let newDoctor = (opts) => {
  let doctor = new Doctor();
  if(opts.ios) {
     doctor.register(iosChecks);
  }
};

export default newDoctor;
