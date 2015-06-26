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
      if (!await check.diagnose().ok) { this.toFix.push(check); }
    }
  }

  async fix() {
    for(let check of this.toFix) {
      await check.fix();
    }
  }
}

export {Doctor, DoctorCheck};
