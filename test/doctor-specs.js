// transpile:mocha

import {Doctor, DoctorCheck} from '../lib/doctor';
import chai from 'chai';
import sinon from 'sinon';
import 'mochawait';
import _ from 'lodash';

chai.should();

describe('doctor', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });

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

  it('diagnose',async () => {
    let {doctor, checks} = configure();
    let mockedDoctorChecks = _.map(checks, (check) => { return sandbox.mock(check); });
    mockedDoctorChecks[0].expects('diagnose').once().returns({ok: true, message: "All Good!"});
    mockedDoctorChecks[1].expects('diagnose').once().returns({ok: false, message: "Oh No!"});
    mockedDoctorChecks[2].expects('diagnose').once().returns({ok: false, message: "Oh No!"});
    await doctor.diagnose();
    for(let mock of mockedDoctorChecks) { mock.verify(); }
    doctor.toFix.should.have.length(2);
  });

  it('fix', async () => {
    let {doctor, checks} = configure();
    doctor.toFix = [checks[1], checks[2]];
    let mockedDoctorChecks = _.map(checks, (check) => { return sandbox.mock(check); });
    mockedDoctorChecks[1].expects('fix').once().returns(true);
    mockedDoctorChecks[2].expects('fix').once().returns(true);
    await doctor.fix();
    for(let mock of mockedDoctorChecks) { mock.verify(); }
  });
});
