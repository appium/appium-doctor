// transpile:mocha

import newDoctor from '../lib/factory';
import chai from 'chai';
import 'mochawait';

chai.should();

describe('factory', () => {
  for(let config of ['ios', 'android', 'dev']) {
    it('should work for ' + config, () => {
      var opts = {};
      opts[config] = true;
      let doctor = newDoctor(opts);
      doctor.should.exists;
      doctor.checks.should.have.length.above(0);
    });
  }
});
