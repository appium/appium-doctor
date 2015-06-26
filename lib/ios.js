import {cp, fs} from './utils';
import {Issue} from './doctor';
import log from './logger';

let issues = [];

// checkForXcode
class XcodeMissing extends Issue {
 async diagnose() {
    let positive = () => { return {exists: true, message: "Xcode is not installed."}; };
    let negative = () => { return {exists: false, message: `Xcode is installed at {this.xcodePath}.`}; };
    try {
      let [stdout] = await cp.exec("xcode-select --print-path", { maxBuffer: 524288});
      this.xcodePath = stdout.replace("\n", "");
    } catch (err) {
      log.debug(err);
      return positive();
    }
    return this.xcodePath && await fs.existsSync(this.xcodePath) ? negative() : positive();
  }

  async fix () {
    await cp.exec("xcode-select --install", { maxBuffer: 524288});
  }
}
issues.push(new XcodeMissing());

