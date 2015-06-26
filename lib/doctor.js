class Issue {
  async diagnose () { return false; }
  async fix () { return true; }
}

class Doctor {
  constructor() {
    this.issues = [];
    this.toFix = [];
  }

  register(issues) {
    if(!Array.isArray(issues)) { issues = [issues]; }
    this.issues = this.issues.concat(issues);
  }

  async diagnose() {
    this.toFix = [];
    for(let issue of this.issues) {
      if (await issue.diagnose()) { this.toFix.push(issue); }
    }
  }

  async fix() {
    for(let issue of this.toFix) {
      await issue.fix();
    }
  }
}

export {Issue, Doctor};
