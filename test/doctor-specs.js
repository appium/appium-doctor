// transpile:mocha

import { Doctor, DoctorCheck } from '../lib/doctor';
import chai from 'chai';
import 'mochawait';
import { withMocks, verifyAll, getSandbox } from './mock-utils';
import { newLogStub } from './log-utils.js';

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
    it('should detect all issues', async () => {
      let logStub = newLogStub(getSandbox(mocks), {stripColors: true});
      let {doctor, checks} = configure();
      mocks.checks = checks.map((check) => { return getSandbox(mocks).mock(check); });
      mocks.checks[0].expects('diagnose').once().returns({ok: true, message: "All Good!"});
      mocks.checks[1].expects('diagnose').once().returns({ok: false, message: "Oh No!"});
      mocks.checks[2].expects('diagnose').once().returns({ok: false, message: "Oh No!"});
      await doctor.diagnose();
      verifyAll(mocks);
      doctor.toFix.should.have.length(2);
      logStub.output.should.equal([
        'info: ### Diagnostic starting ###',
        'info: ✔ All Good!',
        'warn: ✖ Oh No!',
        'warn: ✖ Oh No!',
        'info: ### Diagnostic completed, 2 fixes needed. ###',
        ''
      ].join('\n'));
    });
  }));

  describe('reportSuccess', withMocks({},(mocks) => {
    let doctor = new Doctor();
    it('should report success when no fixes are needed', () => {
      let logStub = newLogStub(getSandbox(mocks), {stripColors: true});
      doctor.toFix = [];
      doctor.reportSuccess().should.equal(true);
      logStub.output.should.equal('info: Everything looks good, bye!\n');
    });

    it('should return false when fixes are needed', () => {
      doctor.toFix = [{}];
      doctor.reportSuccess().should.equal(false);
    });
  }));

  describe('run',  withMocks({}, (mocks) => {
    let doctor = new Doctor();
    it('should report success', async () => {
      mocks.doctor = getSandbox(mocks).mock(doctor);
      mocks.doctor.expects('diagnose').once();
      mocks.doctor.expects('reportSuccess').once().returns(true);
      mocks.doctor.expects('reportManualFixes').never();
      mocks.doctor.expects('runAutoFixes').never();
      await doctor.run();
      verifyAll(mocks);
    });
    it('should report manual fixes', async () => {
      mocks.doctor = getSandbox(mocks).mock(doctor);
      mocks.doctor.expects('diagnose').once();
      mocks.doctor.expects('reportSuccess').once().returns(false);
      mocks.doctor.expects('reportManualFixes').once().returns(true);
      mocks.doctor.expects('runAutoFixes').never();
      await doctor.run();
      verifyAll(mocks);
    });
    it('should run autofixes', async () => {
      mocks.doctor = getSandbox(mocks).mock(doctor);
      mocks.doctor.expects('diagnose').once();
      mocks.doctor.expects('reportSuccess').once().returns(false);
      mocks.doctor.expects('reportManualFixes').once().returns(false);
      mocks.doctor.expects('runAutoFixes').once();
      await doctor.run();
      verifyAll(mocks);
    });
  }));
});
