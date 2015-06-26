// transpile:mocha

import {Doctor, Issue} from '../lib/doctor';
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
    doctor.issues.should.have.length(0);
    doctor.register(new Issue());
    doctor.issues.should.have.length(1);
    doctor.register([new Issue(), new Issue()]);
    doctor.issues.should.have.length(3);
  });

  function configure() {
    let doctor = new Doctor();
    let issues = [new Issue(), new Issue(), new Issue()];
    doctor.register(issues);
    return {doctor, issues};
  }

  it('diagnose',async () => {
    let {doctor, issues} = configure();
    let mockedIssues = _.map(issues, (issue) => { return sinon.mock(issue); });
    mockedIssues[0].expects('diagnose').once().returns(false);
    mockedIssues[1].expects('diagnose').once().returns(true);
    mockedIssues[2].expects('diagnose').once().returns(true);
    await doctor.diagnose();
    for(let mock of mockedIssues) { mock.verify(); }
    doctor.toFix.should.have.length(2);
  });

  it('fix', async () => {
    let {doctor, issues} = configure();
    doctor.toFix = [issues[1], issues[2]];
    let mockedIssues = _.map(issues, (issue) => { return sinon.mock(issue); });
    mockedIssues[1].expects('fix').once().returns(true);
    mockedIssues[2].expects('fix').once().returns(true);
    await doctor.fix();
    for(let mock of mockedIssues) { mock.verify(); }
  });
});
