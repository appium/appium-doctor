// transpile:mocha

import {Doctor, DoctorCheck} from '../lib/doctor';
import chai from 'chai';
import 'mochawait';
import _ from 'lodash';
import {withMocks, verifyAll, getSandbox} from './mock-utils';

chai.should();

describe('doctor', () => {

  it('register', () => {
    let doctor = new Doctor();
    doctor.checks.should.have.length(0);
    doctor.register(new DoctorCheck());
    doctor.checks.should.have.length(1);
    doctor.register([new DoctorCheck(), new DoctorCheck()]);
    doctor.checks.should.have.length(3);
  });

  function configure() {
    let doctor = new Doctor();
    let checks = [new DoctorCheck(), new DoctorCheck(), new DoctorCheck()];
    doctor.register(checks);
    return {doctor, checks};
  }

  describe('diagnose', withMocks({}, (mocks) => {
    it('should detect all issues',async () => {
      let {doctor, checks} = configure();
      mocks.checks = _.map(checks, (check) => { return getSandbox(mocks).mock(check); });
      mocks.checks[0].expects('diagnose').once().returns({ok: true, message: "All Good!"});
      mocks.checks[1].expects('diagnose').once().returns({ok: false, message: "Oh No!"});
      mocks.checks[2].expects('diagnose').once().returns({ok: false, message: "Oh No!"});
      await doctor.diagnose();
      verifyAll(mocks);
      doctor.toFix.should.have.length(2);
    });
  }));

  describe('fix', withMocks({}, (mocks) => {
    it('should fix all issues',async () => {
      let {doctor, checks} = configure();
      doctor.toFix = [checks[1], checks[2]];
      mocks.checks = _.map(checks, (check) => { return getSandbox(mocks).mock(check); });
      mocks.checks[1].expects('fix').once().returns(true);
      mocks.checks[2].expects('fix').once().returns(true);
      await doctor.fix();
      verifyAll(mocks);
    });
  }));
});
