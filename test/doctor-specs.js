// transpile:mocha

import { Doctor, DoctorCheck } from '../lib/doctor';
import chai from 'chai';
import 'mochawait';
import { withMocks, verifyAll, getSandbox } from './mock-utils';
import { newLogStub } from './log-utils.js';

chai.should();
let P = Promise;

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
        'info:  ✔ All Good!',
        'warn:  ✖ Oh No!',
        'warn:  ✖ Oh No!',
        'info: ### Diagnostic completed, 2 fixes needed. ###',
        'info: '
      ].join('\n'));
    });
  }));

  describe('reportSuccess', withMocks({},(mocks) => {
    let doctor = new Doctor();
    it('should report success when no fixes are needed', () => {
      let logStub = newLogStub(getSandbox(mocks), {stripColors: true});
      doctor.toFix = [];
      doctor.reportSuccess().should.equal(true);
      logStub.output.should.equal([
        'info: Everything looks good, bye!',
        'info: '
      ].join('\n'));
    });

    it('should return false when fixes are needed', () => {
      doctor.toFix = [{}];
      doctor.reportSuccess().should.equal(false);
    });
  }));

  describe('reportManualFixes', withMocks({},(mocks) => {
    let doctor = new Doctor();
    it('should ask for manual fixes to be applied', async () => {
      let logStub = newLogStub(getSandbox(mocks), {stripColors: true});
      doctor.toFix = [
        {error: 'Oh no this need to be manually fixed.', check: new DoctorCheck()},
        {error: 'Oh no this is an autofix.', check: new DoctorCheck({autofix: true})},
        {error: 'Oh no this also need to be manually fixed.', check: new DoctorCheck()},
        {error: 'Oh no this also need to be manually fixed.', check: new DoctorCheck()},
      ];
      for(let i=0; i<doctor.toFix.length; i++) {
        let m = getSandbox(mocks).mock(doctor.toFix[i].check);
        if(doctor.toFix[i].check.autofix) {
          m.expects('fix').never();
        } else {
          m.expects('fix').once().returns(P.resolve(`Manual fix for ${i} is do something.`));
       }
      }
      (await doctor.reportManualFixes()).should.equal(true);
      verifyAll(mocks);
      logStub.output.should.equal([
        'info: ### Manual Fixes Needed ###',
        'info: The configuration cannot be automatically fixed, please do the following first:',
        'warn: - Manual fix for 0 is do something.',
        'warn: - Manual fix for 2 is do something.',
        'warn: - Manual fix for 3 is do something.',
        'info: ###',
        'info: ',
        'info: Bye, run appium-doctor again when the all the manual fixes have been applied!',
        'info: '
      ].join('\n'));
    });

    it('should return false when there is no manual fix', async () => {
      doctor.toFix = [{error: 'Oh no!', check: new DoctorCheck({autofix: true}) }];
      (await doctor.reportManualFixes()).should.equal(false);
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
