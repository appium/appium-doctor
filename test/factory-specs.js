// transpile:mocha

import newDoctor from '../lib/factory';
import chai from 'chai';

chai.should();

describe('factory', function () {
  for (let config of [{'ios': true}, {'android': true}, {'dev': true}]) {
    it('should work for ' + config, function () {
      let doctor = newDoctor(config);
      doctor.should.exists;
      doctor.checks.should.have.length.above(0);
    });
  }
});
