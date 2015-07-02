import 'colors';
import _ from 'lodash';
import log from './logger';

class FixSkippedError extends Error {}

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
    log.info('### Diagnostic starting ###');
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
    log.info(`### Diagnostic completed, ${fixMessage}. ###\n`);

  }

  reportSuccess () {
    if(this.toFix.length === 0) {
      log.info('Everything looks good, bye!\n');
      return true;
    } else {
      return false;
    }
  }

  reportManualFixes () {
    let manualFixes = _.filter(this.toFix, (f) => {return !f.check.autofix;});
    if(manualFixes.length >0) {
      log.info('### Manual Fixes Needed ###');
      log.info('The configuration cannot be automatically fixed, please do the following first:');
       // for manual fixes, the fix method always return a string
       let fixMessages = _(manualFixes).chain()
        .map((f) => { return f.check.fix(); })
        .uniq().value();
      for(let m of fixMessages) {
        log.warn(`- ${m}`);
      }
      log.info('###');
      log.info('\nBye, run appium-doctor again when the all the manual fixes have been applied!\n');
      return true;
    } else {
      return false;
    }
  }

  async runAutoFixes () {
    let autoFixes = _.filter(this.toFix, (f) => {return f.check.autofix;});
    for(let f of autoFixes) {
      log.info(`### Fixing: ${f.error} ###`);
      try {
        await f.check.fix();
      } catch (err) {
        if(err instanceof FixSkippedError) {
          log.info(`### Skipped fix for: ${f.error} ###\n`);
          continue;
        } else {
          log.warn(`${err}`.replace(/\n$/g, ''));
          log.info(`### Could not fix: ${f.error} ###\n`);
          continue;
        }
      }
      log.info('Fix was applied running re- running diagnostic.');
      let res = await f.check.diagnose();
      if (res.ok) {
          log.info(`### Fix was successfully applied, new status is: ${res.message} ###\n`);
      } else {
          log.info(`### Fix was apply but issue remains:: ${res.message} ###\n`);
      }
    }
  }

  async run() {
    await this.diagnose();
    if (this.reportSuccess()) return;
    if (this.reportManualFixes()) return;
    await this.runAutoFixes();
   }
}

export { Doctor, DoctorCheck, FixSkippedError };
