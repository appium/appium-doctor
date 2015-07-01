import 'colors';
import log from './logger';

class DoctorCheck {
  async diagnose () { return false; }
  async fix () { return true; }
}

class Doctor {
  constructor() {
    this.checks = [];
    this.toFix = [];
  }

  register(checks) {
    if(!Array.isArray(checks)) { checks = [checks]; }
    this.checks = this.checks.concat(checks);
  }

  async diagnose() {
    this.toFix = [];
    for(let check of this.checks) {
      let res = await check.diagnose();
      if (res.ok) {
        log.info(`${'\u2714'.green} ${res.message}`);
      } else {
        log.warn(`${'\u2716'.red} ${res.message}`);
        this.toFix.push(check);
      }
    }
  }

  async fix() {
    for(let check of this.toFix) {
      await check.fix();
    }
  }

  async run() {
    this.diagnose();
    //this.fix();
  }
}

export {Doctor, DoctorCheck};
