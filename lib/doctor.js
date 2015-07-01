import 'colors';
import _ from 'lodash';
import log from './logger';

class DoctorCheck {
  constructor(opts={}) {
    this.autofix = !!opts.autofix;
  }
  diagnose () { throw new Error('Not Implemented!'); }
  fix () {
    // return string for manual fixes.
    throw new Error('Not Implemented!');
  }
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
        let errorMessage = `${'\u2716'.red} ${res.message}`;
        log.warn(errorMessage);
        this.toFix.push({
          error: errorMessage,
          check: check
        });
      }
    }
  }

  async fixAll() {
    for(let check of this.toFix) {
      await check.fix();
    }
  }

  async run() {
    log.info('\n### Diagnostic starting ###\n');
    await this.diagnose();
    let fixMessage;
    switch (this.toFix.length) {
      case 0:
        fixMessage = "No fix needed";
        break;
      case 1:
        fixMessage = "One fix needed";
        break;
      default:
        fixMessage = `${this.toFix.length} fixes needed`;
    }
    log.info(`\n### Diagnostic completed, ${fixMessage}. ###\n`);

    // no fix needed
    if(this.toFix.length === 0) {
      log.info('Everything looks good, bye!\n');
      return;
    }

    // manual fixes are necessary
    let manualFixes = _.filter(this.toFix, (f) => {return !f.check.autofix;});
    if(manualFixes.length >0) {
      log.info('The configuration cannot be automatically fixed, please do the following first:\n');
       // for manual fixes, the fix method always return a string
       let fixMessages = _(manualFixes).chain()
        .map((f) => { return f.check.fix(); })
        .uniq().value();
      for(let m of fixMessages) {
        log.info(`- ${m}`);
      }
      log.info('\nBye, run me again when the all the manual fixes have been applied!\n');
      return;
    }

    // autofix
    let autoFixes = _.filter(this.toFix, (f) => {return f.check.autofix;});
    for(let f of autoFixes) {
      log.info(`Fixing: ${f.error}`);
    }
   }
}

export { Doctor, DoctorCheck };
